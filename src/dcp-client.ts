import { Socket } from 'net'
import AwaitLock from 'await-lock'

import { ROBOT_INDYRP2, DirectVariableType, IIndyDCPClient } from './const'
import { CommandCode } from './command-code'
import { RobotStatus } from './robot-status'

import {
  SIZE_HEADER_COMMAND,
  SIZE_DATA_TCP_MAX,
  TOOMUCH,
  parsePacketHeader,
  parseExtHeader,
  buildReqPacket,
  buildExtReqPacket,
  check_header
} from './packet'
import { socket_connect, tcp_command, tcp_command_rec, tcp_command_req, tcp_command_req_rec } from './decorators'

/* Indy Client Class */
export class IndyDCPClient implements IIndyDCPClient {
  public JOINT_DOF
  public lock
  public sock_fd
  public time_out
  public invokeId
  public serverIp
  public robotName
  public robotVersion
  public robotStatus
  public sofServer
  public sofClient
  public stepInfo

  private __server_port
  private __lock

  constructor(serverIp, robotName, robotVersion = '') {
    this.__server_port = 6066
    this.sofServer = 0x12
    this.sofClient = 0x34
    this.stepInfo = 0x02
    this.__lock = new AwaitLock()

    this.lock = this.__lock
    this.sock_fd = new Socket()
    this.time_out = 10
    this.invokeId = 0
    this.serverIp = serverIp
    this.robotName = robotName
    this.robotVersion = robotVersion

    this.JOINT_DOF = this.robotName == ROBOT_INDYRP2 ? 7 : 6
  }

  async connect() {
    // await this.__lock.acquireAsync()
    this.sock_fd = new Socket(Socket.AF_INET, Socket.SOCK_STREAM)
    try {
      this.sock_fd.connect((this.serverIp, this.__server_port))

      console.log(`Connect: Server IP (${this.serverIp})`)
      return true
    } catch (e) {
      console.error(e)
      this.sock_fd.close()
      // this.__lock.release()
      return false
    }
  }

  disconnect() {
    this.sock_fd.close()
    // this.__lock.release()
  }

  shutdown() {
    this.sock_fd.shutdown(Socket.SHUT_RDWR)
    console.log('Shut down')
  }

  set_timeout_sec(time_out) {
    if (time_out < 0) {
      console.log(`Invalid time out setting: ${time_out} < 0`)
    }

    this.time_out = time_out
  }

  _send_message(buf, size?) {
    //     dump_buf("SendBytes: ", buf, size)
    //     total_sent = 0
    //     while total_sent < size:
    //         this.sock_fd.settimeout(this.time_out)
    //         sent = this.sock_fd.send(buf[total_sent:size])
    //         if sent == -1:
    //             console.log('Error: sent == -1')
    //             return -1
    //         elif sent == 0:
    //             # this.__lock.release()
    //             console.log('Error: sent == 0')
    //             return -1
    //         total_sent = total_sent + sent
    //     return 0
  }

  _recv_message(buf, size?): any {
    //     chunks = []
    //     bytes_recd = 0
    //     while bytes_recd < size:
    //         this.sock_fd.settimeout(this.time_out)
    //         chunk = this.sock_fd.recv(size - bytes_recd)
    //         if chunk == b'':
    //             console.log('Error: receive error')
    //             memset (buf, 0, sizeof (buf))
    //             # this.__lock.release()
    //             this.shutdown()
    //             return -1
    //         chunks.append(chunk)
    //         if (bytes_recd + len(chunk)) > sizeof (buf):
    //             break
    //         bytes_recd += len(chunk)
    //     data = b''.join(chunks)
    //     memset(buf, 0, sizeof (buf))
    //     memmove(buf, data, len(data))
    //     return buf
  }

  get_robotStatus() {
    this.check()
    return this.robotStatus
  }

  @socket_connect
  handle_command(cmd, reqBuffer?, reqBufferSize?): { error_code; res_data; res_data_size } {
    var { header: reqHeader, buffer } = buildReqPacket(cmd, reqBuffer, reqBufferSize)
    this._send_message(buffer)

    // Recv header from socket
    var resHeader = parsePacketHeader(this._recv_message(Buffer.alloc(SIZE_HEADER_COMMAND)))

    // Recv data from socket
    var res_data_size = resHeader.dataSize
    if (res_data_size > SIZE_DATA_TCP_MAX || res_data_size < 0) {
      console.log(`Response data size is invalid ${res_data_size} (max: {}): Disconnected`)
      this.disconnect()
    } else {
      var res_data = this._recv_message(Buffer.alloc(res_data_size))
    }

    var error_code = check_header(reqHeader, resHeader, res_data.readInt32BE())
    this.robotStatus = RobotStatus.from(resHeader.status)

    return {
      error_code,
      res_data,
      res_data_size
    }
  }

  @socket_connect
  handle_extended_command(ext_cmd, req_ext_data?, req_ext_data_size?): { error_code; res_data; res_data_size } {
    var { header: reqHeader, buffer } = buildExtReqPacket(ext_cmd, req_ext_data, req_ext_data_size)
    this._send_message(buffer)

    // Recv header from socket
    var resHeader = parsePacketHeader(this._recv_message(Buffer.alloc(SIZE_HEADER_COMMAND)))

    // Recv data from socket
    var res_data_size = resHeader.dataSize
    if (res_data_size > SIZE_DATA_TCP_MAX || res_data_size < 0) {
      console.log(`Response data size is invalid ${res_data_size} (max: {}): Disconnected`)
      this.disconnect()
    } else {
      var res_data = this._recv_message(Buffer.alloc(res_data_size))
    }

    // Recv extended data from socket
    var { dataSize: resExtDataSize, cmdId: resExtCmd } = parseExtHeader(res_data)

    if (resExtDataSize < 0 || resExtDataSize > TOOMUCH) {
      this.disconnect()
      console.log('Recv data error: size')
    } else if (resExtCmd !== ext_cmd) {
      this.disconnect()
      console.log(`Recv data error: ext_cmd ${resExtCmd}/${ext_cmd}`)
    } else if (resExtDataSize > 0) {
      var resExtData = this._recv_message(Buffer.alloc(resExtDataSize))
    }

    var error_code = check_header(reqHeader, resHeader, res_data.readInt32BE())
    this.robotStatus = RobotStatus.from(resHeader.status)

    return {
      error_code,
      res_data,
      res_data_size
    }
  }

  /* Robot command function (Check all) */
  check() {
    // Get robot status
    var { error_code, res_data, res_data_size } = this.handle_command(CommandCode.CMD_CHECK)
    if (!error_code) {
      // TODO
    }
  }

  @tcp_command(CommandCode.CMD_EMERGENCY_STOP)
  emergency_stop() {}

  @tcp_command(CommandCode.CMD_RESET_ROBOT)
  reset_robot() {}

  @tcp_command_req(CommandCode.CMD_SET_SERVO, 'bool6dArr', this.JOINT_DOF * 1)
  set_servo(arr) {}

  @tcp_command_req(CommandCode.CMD_SET_BRAKE, 'bool6dArr', this.JOINT_DOF * 1)
  set_brake(arr) {}

  @tcp_command(CommandCode.CMD_STOP)
  stop_motion() {}

  execute_move(cmd_name) {
    var req_data = cmd_name
    var req_data_size = cmd_name.length

    return this.handle_command(CommandCode.CMD_MOVE, req_data, req_data_size)
  }

  // Move commands
  @tcp_command(CommandCode.CMD_MOVE_HOME)
  go_home() {}

  @tcp_command(CommandCode.CMD_MOVE_ZERO)
  go_zero() {}

  @tcp_command_req(CommandCode.CMD_JOINT_MOVE_TO, 'double7dArr', this.JOINT_DOF * 8)
  _7dof_joint_move_to(q) {}

  @tcp_command_req(CommandCode.CMD_JOINT_MOVE_TO, 'double6dArr', this.JOINT_DOF * 8)
  _6dof_joint_move_to(q) {}

  joint_move_to(q) {
    if (this.JOINT_DOF == 7) {
      this._7dof_joint_move_to(q)
    } else {
      this._6dof_joint_move_to(q)
    }
  }

  @tcp_command_req(CommandCode.CMD_JOINT_MOVE_BY, 'double7dArr', this.JOINT_DOF * 8)
  _7dof_joint_move_by(q) {}

  @tcp_command_req(CommandCode.CMD_JOINT_MOVE_BY, 'double6dArr', this.JOINT_DOF * 8)
  _6dof_joint_move_by(q) {}

  joint_move_by(q) {
    if (this.JOINT_DOF == 7) {
      this._7dof_joint_move_by(q)
    } else {
      this._6dof_joint_move_by(q)
    }
  }

  @tcp_command_req(CommandCode.CMD_TASK_MOVE_TO, 'double6dArr', 6 * 8)
  task_move_to(p) {}

  @tcp_command_req(CommandCode.CMD_TASK_MOVE_BY, 'double6dArr', 6 * 8)
  task_move_by(p) {}

  // Program control
  @tcp_command(CommandCode.CMD_START_CURRENT_PROGRAM)
  start_current_program() {}

  @tcp_command(CommandCode.CMD_PAUSE_CURRENT_PROGRAM)
  pause_current_program() {}

  @tcp_command(CommandCode.CMD_RESUME_CURRENT_PROGRAM)
  resume_current_program() {}

  @tcp_command(CommandCode.CMD_STOP_CURRENT_PROGRAM)
  stop_current_program() {}

  @tcp_command(CommandCode.CMD_START_DEFAULT_PROGRAM)
  start_default_program() {}

  @tcp_command_req(CommandCode.CMD_REGISTER_DEFAULT_PROGRAM_IDX, 'intVal', 4)
  set_default_program(idx) {}

  @tcp_command_rec(CommandCode.CMD_GET_REGISTERED_DEFAULT_PROGRAM_IDX, 'intVal')
  get_default_program_idx() {}

  // Get robot status
  @tcp_command_rec(CommandCode.CMD_IS_ROBOT_RUNNING, 'boolVal')
  is_robot_running() {}

  @tcp_command_rec(CommandCode.CMD_IS_READY, 'boolVal')
  is_robot_ready() {}

  @tcp_command_rec(CommandCode.CMD_IS_EMG, 'boolVal')
  is_emergency_stop() {}

  @tcp_command_rec(CommandCode.CMD_IS_COLLIDED, 'boolVal')
  is_collided() {}

  @tcp_command_rec(CommandCode.CMD_IS_ERR, 'boolVal')
  is_error_state() {}

  @tcp_command_rec(CommandCode.CMD_IS_BUSY, 'boolVal')
  is_busy() {}

  @tcp_command_rec(CommandCode.CMD_IS_MOVE_FINISEHD, 'boolVal')
  is_move_finished() {}

  @tcp_command_rec(CommandCode.CMD_IS_HOME, 'boolVal')
  is_home() {}

  @tcp_command_rec(CommandCode.CMD_IS_ZERO, 'boolVal')
  is_zero() {}

  @tcp_command_rec(CommandCode.CMD_IS_IN_RESETTING, 'boolVal')
  is_in_resetting() {}

  @tcp_command_rec(CommandCode.CMD_IS_DIRECT_TECAHING, 'boolVal')
  is_direct_teaching_mode() {}

  @tcp_command_rec(CommandCode.CMD_IS_TEACHING, 'boolVal')
  is_teaching_mode() {}

  @tcp_command_rec(CommandCode.CMD_IS_PROGRAM_RUNNING, 'boolVal')
  is_program_running() {}

  @tcp_command_rec(CommandCode.CMD_IS_PROGRAM_PAUSED, 'boolVal')
  is_program_paused() {}

  @tcp_command_rec(CommandCode.CMD_IS_CONTY_CONNECTED, 'boolVal')
  is_conty_connected() {}

  // Direct teaching
  @tcp_command(CommandCode.CMD_CHANGE_DIRECT_TEACHING)
  change_to_direct_teaching() {}

  @tcp_command(CommandCode.CMD_FINISH_DIRECT_TEACHING)
  finish_direct_teaching() {}

  // Simple waypoint program, joint and task.
  // TODO JOINT_DOF 를 접근할 수 없는데...
  @tcp_command_req(CommandCode.CMD_JOINT_PUSH_BACK_WAYPOINT_SET, 'double6dArr', this.JOINT_DOF * 8)
  push_back_joint_waypoint(q) {}

  @tcp_command(CommandCode.CMD_JOINT_POP_BACK_WAYPOINT_SET)
  pop_back_joint_waypoint() {}

  @tcp_command(CommandCode.CMD_JOINT_CLEAR_WAYPOINT_SET)
  clear_joint_waypoints() {}

  @tcp_command(CommandCode.CMD_JOINT_EXECUTE_WAYPOINT_SET)
  execute_joint_waypoints() {}

  @tcp_command_req(CommandCode.CMD_TASK_PUSH_BACK_WAYPOINT_SET, 'double6dArr', 6 * 8)
  push_back_task_waypoint(p) {}

  @tcp_command(CommandCode.CMD_TASK_POP_BACK_WAYPOINT_SET)
  pop_back_task_waypoint() {}

  @tcp_command(CommandCode.CMD_TASK_CLEAR_WAYPOINT_SET)
  clear_task_waypoints() {}

  @tcp_command(CommandCode.CMD_TASK_EXECUTE_WAYPOINT_SET)
  execute_task_waypoints() {}

  // Get/Set some global robot variables
  @tcp_command_req(CommandCode.CMD_SET_DEFAULT_TCP, 'double6dArr', 6 * 8)
  set_default_tcp(tcp) {}

  @tcp_command(CommandCode.CMD_RESET_DEFAULT_TCP)
  reset_default_tcp() {}

  @tcp_command_req(CommandCode.CMD_SET_COMP_TCP, 'double6dArr', 6 * 8)
  set_tcp_compensation(tcp) {}

  @tcp_command(CommandCode.CMD_RESET_COMP_TCP)
  reset_tcp_compensation() {}

  @tcp_command_req(CommandCode.CMD_SET_REFFRAME, 'double6dArr', 6 * 8)
  set_ref_frame(ref) {}

  @tcp_command(CommandCode.CMD_RESET_REFFRAME)
  reset_ref_frame() {}

  @tcp_command_req(CommandCode.CMD_SET_COLLISION_LEVEL, 'intVal', 4)
  set_collision_level(level) {}

  @tcp_command_req(CommandCode.CMD_SET_JOINT_BOUNDARY, 'intVal', 4)
  set_joint_speed_level(level) {}

  @tcp_command_req(CommandCode.CMD_SET_TASK_BOUNDARY, 'intVal', 4)
  set_task_speed_level(level) {}

  @tcp_command_req(CommandCode.CMD_SET_JOINT_WTIME, 'doubleVal', 8)
  set_joint_waypoint_time(time) {}

  @tcp_command_req(CommandCode.CMD_SET_TASK_WTIME, 'doubleVal', 8)
  set_task_waypoint_time(time) {}

  @tcp_command_req(CommandCode.CMD_SET_TASK_CMODE, 'intVal', 4)
  set_task_base_mode(mode) {
    // 0: reference body, 1: end-effector tool tip
  }

  @tcp_command_req(CommandCode.CMD_SET_JOINT_BLEND_RADIUS, 'doubleVal', 8)
  set_joint_blend_radius(radius) {}

  @tcp_command_req(CommandCode.CMD_SET_TASK_BLEND_RADIUS, 'doubleVal', 8)
  set_task_blend_radius(radius) {}

  @tcp_command_rec(CommandCode.CMD_GET_DEFAULT_TCP, 'double6dArr')
  get_default_tcp() {}

  @tcp_command_rec(CommandCode.CMD_GET_COMP_TCP, 'double6dArr')
  get_tcp_compensation() {}

  @tcp_command_rec(CommandCode.CMD_GET_REFFRAME, 'double6dArr')
  get_ref_frame() {}

  @tcp_command_rec(CommandCode.CMD_GET_COLLISION_LEVEL, 'intVal')
  get_collision_level() {}

  @tcp_command_rec(CommandCode.CMD_GET_JOINT_BOUNDARY, 'intVal')
  get_joint_speed_level() {}

  @tcp_command_rec(CommandCode.CMD_GET_TASK_BOUNDARY, 'intVal')
  get_task_speed_level() {}

  @tcp_command_rec(CommandCode.CMD_GET_JOINT_WTIME, 'doubleVal')
  get_joint_waypoint_time() {}

  @tcp_command_rec(CommandCode.CMD_GET_TASK_WTIME, 'doubleVal')
  get_task_waypoint_time() {}

  @tcp_command_rec(CommandCode.CMD_GET_TASK_CMODE, 'intVal')
  get_task_base_mode() {}

  @tcp_command_rec(CommandCode.CMD_GET_JOINT_BLEND_RADIUS, 'doubleVal')
  get_joint_blend_radius() {}

  @tcp_command_rec(CommandCode.CMD_GET_TASK_BLEND_RADIUS, 'doubleVal')
  get_task_blend_radius() {}

  @tcp_command_rec(CommandCode.CMD_GET_RUNNING_TIME, 'doubleVal')
  get_robot_running_time() {}

  @tcp_command_rec(CommandCode.CMD_GET_CMODE, 'intVal')
  get_cmode() {}

  get_servo_state() {
    var { error_code, res_data, res_data_size } = this.handle_command(CommandCode.CMD_GET_JOINT_STATE)
    if (!error_code) {
      // result = np.array(res_data.charArr)
      // servo_state = result[0:JOINT_DOF].tolist()
      // brake_state = result[JOINT_DOF:2*JOINT_DOF].tolist()
      // return servo_state, brake_state
    }
  }

  @tcp_command_rec(CommandCode.CMD_GET_JOINT_POSITION, 'double6dArr')
  get_joint_pos() {
    if (this.JOINT_DOF == 7) {
      return 'double7dArr'
    } else {
      return 'double6dArr'
    }
  }

  @tcp_command_rec(CommandCode.CMD_GET_JOINT_VELOCITY, 'double6dArr')
  get_joint_vel() {
    if (this.JOINT_DOF == 7) {
      return 'double7dArr'
    } else {
      return 'double6dArr'
    }
  }

  @tcp_command_rec(CommandCode.CMD_GET_TASK_POSITION, 'double6dArr')
  get_task_pos() {
    return 'double6dArr'
  }

  @tcp_command_rec(CommandCode.CMD_GET_TASK_VELOCITY, 'double6dArr')
  get_task_vel() {
    return 'double6dArr'
  }

  @tcp_command_rec(CommandCode.CMD_GET_TORQUE, 'double6dArr')
  get_torque() {
    return 'double6dArr'
  }

  get_last_emergency_info() {
    // Check (TODO: represent meaning of results)
    var { error_code, res_data, res_data_size } = this.handle_command(CommandCode.CMD_GET_LAST_EMG_INFO)
    if (!error_code) {
      // ret_code = c_int32()
      // ret_int_arr = (c_int32 * 3)()
      // ret_double_arr = (c_double*3)()
      // memmove(addressof(ret_code), addressof(res_data.byte), 4)
      // memmove(addressof(ret_int_arr), addressof(res_data.byte) + 4, 4 * 3)
      // memmove(addressof(ret_double_arr), addressof(res_data.byte) + 16, 8 * 3)
      // return np.array(ret_code).tolist(), np.array(ret_int_arr).tolist(), np.array(ret_double_arr).tolist()
    }
  }

  // I/O
  @tcp_command_req_rec(CommandCode.CMD_GET_SMART_DI, 'intVal', 4, 'charVal')
  get_smart_di(idx) {}

  get_smart_dis() {
    var { error_code, res_data, res_data_size } = this.handle_command(CommandCode.CMD_GET_SMART_DIS)
    if (error_code) {
      return error_code
    } else {
      // return np.array(res_data.charArr).tolist()[0:32]
    }
  }

  set_smart_do(idx, val) {
    var req_data_size = 5
    var req_data = Buffer.alloc(req_data_size)

    req_data.writeInt32BE(4 * idx)
    req_data.writeInt8(val)
    //     memmove(req_data.byte, pointer(c_int32(idx)), sizeof(c_int32))
    //     memmove(addressof(req_data.byte)+4, pointer(c_ubyte(val)), sizeof(c_ubyte))
    this.handle_command(CommandCode.CMD_SET_SMART_DO, req_data, req_data_size)
  }

  @tcp_command_req(CommandCode.CMD_SET_SMART_DOS, 'charArr', 32)
  set_smart_dos(idx) {}

  @tcp_command_req_rec(CommandCode.CMD_GET_SMART_AI, 'intVal', 4, 'intVal')
  get_smart_ai(idx) {}

  set_smart_ao(idx, val) {
    var req_data_size = 8
    var req_data = Buffer.alloc(req_data_size)

    req_data.writeInt32BE(idx)
    req_data.writeInt32BE(val)

    this.handle_command(CommandCode.CMD_SET_SMART_AO, req_data, req_data_size)
  }

  @tcp_command_req_rec(CommandCode.CMD_GET_SMART_DO, 'intVal', 4, 'charVal')
  get_smart_do(idx) {}

  @tcp_command_rec(CommandCode.CMD_GET_SMART_DOS, 'charArr')
  get_smart_dos() {}

  @tcp_command_req_rec(CommandCode.CMD_GET_SMART_AO, 'intVal', 4, 'intVal')
  get_smart_ao(idx) {}

  set_endtool_do(endtool_type, val) {
    // endtool_type:
    // 0: NPN, 1: PNP, 2: Not use, 3: eModi
    var req_data_size = 5
    var req_data = Buffer.alloc(req_data_size)

    req_data.writeInt32BE(endtool_type)
    req_data.writeInt8(val)

    return this.handle_command(CommandCode.CMD_SET_ENDTOOL_DO, req_data, req_data_size)
  }

  @tcp_command_req_rec(CommandCode.CMD_GET_ENDTOOL_DO, 'intVal', 4, 'charVal')
  get_endtool_do(type) {}

  // FT sensor implementation
  @tcp_command_rec(CommandCode.CMD_GET_EXTIO_FTCAN_ROBOT_RAW, 'int6dArr')
  get_robot_ft_sensor_raw() {}

  @tcp_command_rec(CommandCode.CMD_GET_EXTIO_FTCAN_ROBOT_TRANS, 'double6dArr')
  get_robot_ft_sensor_process() {}

  @tcp_command_rec(CommandCode.CMD_GET_EXTIO_FTCAN_CB_RAW, 'int6dArr')
  get_cb_ft_sensor_raw() {}

  @tcp_command_rec(CommandCode.CMD_GET_EXTIO_FTCAN_CB_TRANS, 'double6dArr')
  get_cb_ft_sensor_process() {}

  read_direct_variable(dv_type, dv_addr) {
    var req_data_size = 8
    var req_data = Buffer.alloc(req_data_size)

    req_data.writeInt32BE(dv_type)
    req_data.writeInt32BE(dv_addr)

    var { error_code, res_data, res_data_size } = this.handle_command(
      CommandCode.CMD_READ_DIRECT_VARIABLE,
      req_data,
      req_data_size
    )

    if (error_code) {
      return error_code
    }

    switch (dv_type) {
      case DirectVariableType.BYTE: // B
      // if res_data_size == 1:
      //     return np.array(res_data.byteVal)
      case DirectVariableType.WORD: // W
      // if res_data_size == 2:
      //     val = np.array(res_data.wordVal).tolist()
      //     console.log(val)
      //     res = int.from_bytes(val, byteorder='little', signed=true)
      //     return res
      case DirectVariableType.DWORD: // I
      // if res_data_size == 4:
      //     val = np.array(res_data.dwordVal).tolist()
      //     res = int.from_bytes(val, byteorder='little', signed=true)
      //     return res
      case DirectVariableType.LWORD: // L
      // if res_data_size == 8:
      //     val = np.array(res_data.lwordVal).tolist()
      //     res = int.from_bytes(val, byteorder='little', signed=true)
      //     return res
      case DirectVariableType.FLOAT: // F
      // if res_data_size == 4:
      //     return np.array(res_data.floatVal)
      case DirectVariableType.DFLOAT: // D
      // if res_data_size == 8:
      //     return np.array(res_data.doubleVal)
      case DirectVariableType.MODBUS_REG: // M
      // if res_data_size == 2:
      //     val = np.array(res_data.uwordVal).tolist()
      //     res = int.from_bytes(val, byteorder='little', signed=false)
      //     return res
      default:
        console.log('None matched type')
        return false
    }
  }

  read_direct_variables(dv_type, dv_addr, dv_len) {
    if (dv_len > 20) {
      console.log(`Length should be less than 20, but ${dv_len}`)
      return
    }

    var req_data_size = 12
    var req_data = Buffer.alloc(req_data_size)

    req_data.writeInt32BE(dv_type)
    req_data.writeInt32BE(dv_addr)
    req_data.writeInt32BE(dv_len)

    var { error_code, res_data, res_data_size } = this.handle_command(
      CommandCode.CMD_READ_DIRECT_VARIABLES,
      req_data,
      req_data_size
    )

    if (error_code) {
      return error_code
    }

    switch (dv_type) {
      case DirectVariableType.BYTE: // B
      // if res_data_size == 1*dv_len:
      //     res = []
      //     for dv_n in range(0, dv_len):
      //         res.append(np.array(res_data.byteArr)[dv_n])
      //     return res
      case DirectVariableType.WORD: // W
      // if res_data_size == 2*dv_len:
      //     res = []
      //     for dv_n in range(0, dv_len):
      //         val = np.array(res_data.wordArr)[dv_n].tolist()
      //         res.append(int.from_bytes(val, byteorder='little', signed=true))
      //     return res
      case DirectVariableType.DWORD: // I
      // if res_data_size == 4*dv_len:
      //     res = []
      //     for dv_n in range(0, dv_len):
      //         val = np.array(res_data.dwordArr)[dv_n].tolist()
      //         res.append(int.from_bytes(val, byteorder='little', signed=true))
      //     return res
      case DirectVariableType.LWORD: // L
      // if res_data_size == 8*dv_len:
      //     res = []
      //     for dv_n in range(0, dv_len):
      //         val = np.array(res_data.lwordArr)[dv_n].tolist()
      //         res.append(int.from_bytes(val, byteorder='little', signed=true))
      //     return res
      case DirectVariableType.FLOAT: // F
      // if res_data_size == 4*dv_len:
      //     res = []
      //     for dv_n in range(0, dv_len):
      //         res.append(np.array(res_data.floatArr)[dv_n])
      //     return res
      case DirectVariableType.DFLOAT: // D
      // if res_data_size == 8*dv_len:
      //     res = []
      //     for dv_n in range(0, dv_len):
      //         res.append(np.array(res_data.doubleArr)[dv_n])
      //     return res
      case DirectVariableType.MODBUS_REG: // M
      // if res_data_size == 2*dv_len:
      //     res = []
      //     for dv_n in range(0, dv_len):
      //         val = np.array(res_data.uwordArr)[dv_n].tolist()
      //         res.append(int.from_bytes(val, byteorder='little', signed=false))
      //     return res
      default:
        console.log('None matched type')
        return false
    }
  }

  write_direct_variable(dv_type, dv_addr, val) {
    var req_data_size = 8

    var req_data = Buffer.alloc(req_data_size)
    req_data.writeInt32BE(dv_type)
    req_data.writeInt32BE(dv_addr)

    switch (dv_type) {
      case DirectVariableType.BYTE:
      // memmove(addressof(req_data.byte) + 8, pointer(c_uint8(val)), 1)
      // req_data_size += 1
      // console.log(np.array(req_data.byte))
      // console.log(req_data_size)
      case DirectVariableType.WORD:
      // memmove(addressof(req_data.byte) + 8, pointer(c_int16(val)), 2)
      // req_data_size += 2
      // console.log(np.array(req_data.byte))
      // console.log(req_data_size)
      case DirectVariableType.DWORD:
      // memmove(addressof(req_data.byte) + 8, pointer(c_int32(val)), 4)
      // req_data_size += 4
      case DirectVariableType.LWORD:
      // memmove(addressof(req_data.byte) + 8, pointer(c_int64(val)), 8)
      // req_data_size += 8
      case DirectVariableType.FLOAT:
      // memmove(addressof(req_data.byte) + 8, pointer(c_float(val)), 4)
      // req_data_size += 4
      case DirectVariableType.DFLOAT:
      // memmove(addressof(req_data.byte) + 8, pointer(c_double(val)), 8)
      // req_data_size += 8
      case DirectVariableType.MODBUS_REG:
      // memmove(addressof(req_data.byte) + 8, pointer(c_uint16(val)), 2)
      // req_data_size += 2
      default:
        console.log('None matched type')
    }

    this.handle_command(CommandCode.CMD_WRITE_DIRECT_VARIABLE, req_data, req_data_size)
  }

  write_direct_variables(dv_type, dv_addr, dv_len, val) {
    var req_data_size = 12
    var req_data = Buffer.alloc(req_data_size)

    req_data.writeInt32BE(dv_type)
    req_data.writeInt32BE(dv_addr)
    req_data.writeInt32BE(dv_len)

    switch (dv_type) {
      case DirectVariableType.BYTE:
      // for ii in range(0, dv_len):
      //     memmove(addressof(req_data.byte) + 12 + 1*ii, pointer(c_uint8(val[ii])), 1)
      //     req_data_size += 1
      case DirectVariableType.WORD:
      // for ii in range(0, dv_len):
      //     type_size = 2
      //     memmove(addressof(req_data.byte) + 12 + type_size*ii, pointer(c_int16(val[ii])), type_size)
      //     req_data_size += type_size
      case DirectVariableType.DWORD:
      // for ii in range(0, dv_len):
      //     type_size = 4
      //     memmove(addressof(req_data.byte) + 12 + type_size*ii, pointer(c_int32(val[ii])), type_size)
      //     req_data_size += type_size
      case DirectVariableType.LWORD:
      // for ii in range(0, dv_len):
      //     type_size = 8
      //     memmove(addressof(req_data.byte) + 12 + type_size*ii, pointer(c_int64(val[ii])), type_size)
      //     req_data_size += type_size
      case DirectVariableType.FLOAT:
      // for ii in range(0, dv_len):
      //     type_size = 4
      //     memmove(addressof(req_data.byte) + 12 + type_size*ii, pointer(c_float(val[ii])), type_size)
      //     req_data_size += type_size
      case DirectVariableType.DFLOAT:
      // for ii in range(0, dv_len):
      //     type_size = 8
      //     memmove(addressof(req_data.byte) + 12 + type_size*ii, pointer(c_double(val[ii])), type_size)
      //     req_data_size += type_size
      case DirectVariableType.MODBUS_REG:
      // for ii in range(0, dv_len):
      //     type_size = 2
      //     memmove(addressof(req_data.byte) + 12 + type_size*ii, pointer(c_uint16(val[ii])), type_size)
      //     req_data_size += type_size
      default:
        console.log('None matched type')
    }

    this.handle_command(CommandCode.CMD_WRITE_DIRECT_VARIABLES, req_data, req_data_size)
  }

  // Not released
  @tcp_command_req(CommandCode.CMD_SET_REDUCED_MODE, 'boolVal', 1)
  set_reduced_mode(mode) {}

  @tcp_command_req(CommandCode.CMD_SET_REDUCED_SPEED_RATIO, 'doubleVal', 8)
  set_reduced_speed_ratio(ratio) {}

  @tcp_command_rec(CommandCode.CMD_GET_REDUCED_MODE, 'boolVal')
  get_reduced_mode() {}

  @tcp_command_rec(CommandCode.CMD_GET_REDUCED_SPEED_RATIO, 'doubleVal')
  get_reduced_speed_ratio() {}

  /* Extended IndyDCP command (Check all) */

  move_ext_traj_bin(traj_type, traj_freq, dat_size, traj_data, dat_num = 3) {
    var dat_len = traj_data.length
    var opt_data = [traj_type, traj_freq, dat_num, dat_size, Math.floor(dat_len / (dat_size * dat_num))]
    //     ext_data1 = np.array(opt_data).tobytes()
    //     ext_data2 = np.array(traj_data).tobytes()
    //     req_ext_data = ext_data1 + ext_data2
    //     req_ext_data_size = len(req_ext_data)
    // this._handle_extended_command(EXT_CommandCode.CMD_MOVE_TRAJ_BY_DATA, req_ext_data, req_ext_data_size)
  }

  move_ext_traj_txt(traj_type, traj_freq, dat_size, traj_data, dat_num = 3) {
    //     opt_len = 5
    //     dat_len = len(traj_data)
    //     ext_data_size = opt_len + dat_len
    //     ext_data = [None] * ext_data_size
    //     ext_data[0] = traj_type
    //     ext_data[1] = traj_freq
    //     ext_data[2] = dat_num
    //     ext_data[3] = dat_size
    //     ext_data[4] = Math.floor(dat_len/(dat_size*dat_num))  # traj_len
    //     ext_data[5:-1] = traj_data
    //     ext_data_str = ' '.join(str(e) for e in ext_data)
    //     req_ext_data = ext_data_str.encode('ascii')
    //     req_ext_data_size = len(ext_data_str)
    //     this._handle_extended_command(EXT_CommandCode.CMD_MOVE_TRAJ_BY_TXT_DATA,
    //                                   req_ext_data,
    //                                   req_ext_data_size)
  }

  move_ext_traj_bin_file(file_name) {
    //     file_name += "\0"  # last char should be null
    //     req_ext_data = file_name.encode('ascii')
    //     req_ext_data_size = len(file_name)
    //     this._handle_extended_command(EXT_CommandCode.CMD_MOVE_TRAJ_BY_FILE,
    //                                   req_ext_data,
    //                                   req_ext_data_size)
  }

  move_ext_traj_txt_file(file_name) {
    //     file_name += "\0"  # last char should be null
    //     req_ext_data = file_name.encode('ascii')
    //     req_ext_data_size = len(file_name)
    //     this._handle_extended_command(EXT_CommandCode.CMD_MOVE_TRAJ_BY_TXT_FILE,
    //                                   req_ext_data,
    //                                   req_ext_data_size)
  }

  joint_move_to_wp_set() {}

  task_move_to_wp_set() {}

  /* JSON programming added (only for internal engineer) */
  set_json_program() {}

  set_and_start_json_program(json_string) {
    //     json_string += "\0"
    //     req_ext_data = json_string.encode('ascii')
    //     req_ext_data_size = len(json_string)
    //     this._handle_extended_command(EXT_CommandCode.CMD_SET_JSON_PROG_START,
    //                                   req_ext_data,
    //                                   req_ext_data_size)
  }

  wait_for_program_finish() {
    //     while this.is_program_running():
    //         pass
    //     console.log('Program Finished: ', GLOBAL_DICT['stop'])
    //     return GLOBAL_DICT['stop']
  }

  set_workspace(cmd_pos) {
    //     if np.all(cmd_pos != 0):
    //         return true
    //     else:
    //         return false
  }

  /* Teaching points */
  load_teaching_data(file_name) {
    //     with open(file_name, "r") as json_file:
    //         teach_config = json.load(json_file)
    //         return teach_config
  }

  update_teaching_data(file_name, wp_name, j_pos) {
    //     new_pos = []
    //     for pos in j_pos:
    //         new_pos.append(float(pos))
    //     teach_data = {wp_name: new_pos}
    //     # If not an exist file
    //     if not os.path.isfile(file_name):
    //         with open(file_name, "w+") as f:
    //             json.dump(teach_data, f)
    //             return teach_data
    //     #
    //     with open(file_name, "r") as json_file:
    //         teach_config = json.load(json_file)
    //         teach_config.update(teach_data)
    //     with open(file_name, "w+") as json_file:
    //         json.dump(teach_config, json_file)
    //         return teach_config
  }

  del_teaching_data(file_name, wp_name) {
    //     with open(file_name) as json_file:
    //         teach_config = json.load(json_file)
    //         del teach_config[wp_name]
    //     with open(file_name, 'w') as f:
    //         json.dump(teach_config, f)
    //     return teach_config
  }
}
