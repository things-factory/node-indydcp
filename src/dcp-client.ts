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
  checkHeader
} from './packet'
import { socket_connect, tcp_command, tcp_command_rec, tcp_command_req, tcp_command_req_rec } from './decorators'

/* Indy Client Class */
export class IndyDCPClient implements IIndyDCPClient {
  public JOINT_DOF
  public lock
  public sockFd
  public timeout
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
    this.sockFd = new Socket()
    this.timeout = 10
    this.invokeId = 0
    this.serverIp = serverIp
    this.robotName = robotName
    this.robotVersion = robotVersion

    this.JOINT_DOF = this.robotName == ROBOT_INDYRP2 ? 7 : 6
  }

  async connect() {
    // await this.__lock.acquireAsync()
    this.sockFd = new Socket(Socket.AF_INET, Socket.SOCK_STREAM)
    try {
      this.sockFd.connect((this.serverIp, this.__server_port))

      console.log(`Connect: Server IP (${this.serverIp})`)
      return true
    } catch (e) {
      console.error(e)
      this.sockFd.close()
      // this.__lock.release()
      return false
    }
  }

  disconnect() {
    this.sockFd.close()
    // this.__lock.release()
  }

  shutdown() {
    this.sockFd.shutdown(Socket.SHUT_RDWR)
    console.log('Shut down')
  }

  setTimeoutSec(timeout) {
    if (timeout < 0) {
      console.log(`Invalid time out setting: ${timeout} < 0`)
    }

    this.timeout = timeout
  }

  _send_message(buf, size?) {
    //     dump_buf("SendBytes: ", buf, size)
    //     total_sent = 0
    //     while total_sent < size:
    //         this.sockFd.settimeout(this.timeout)
    //         sent = this.sockFd.send(buf[total_sent:size])
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
    //         this.sockFd.settimeout(this.timeout)
    //         chunk = this.sockFd.recv(size - bytes_recd)
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

  getRobotStatus() {
    this.check()
    return this.robotStatus
  }

  @socket_connect
  handleCommand(command, reqBuffer?, reqBufferSize?): { errorCode; resData; resDataSize } {
    var { header: reqHeader, buffer } = buildReqPacket(command, reqBuffer, reqBufferSize)
    this._send_message(buffer)

    // Recv header from socket
    var resHeader = parsePacketHeader(this._recv_message(Buffer.alloc(SIZE_HEADER_COMMAND)))

    // Recv data from socket
    var resDataSize = resHeader.dataSize
    if (resDataSize > SIZE_DATA_TCP_MAX || resDataSize < 0) {
      console.log(`Response data size is invalid ${resDataSize} (max: {}): Disconnected`)
      this.disconnect()
    } else {
      var resData = this._recv_message(Buffer.alloc(resDataSize))
    }

    var errorCode = checkHeader(reqHeader, resHeader, resData.readInt32BE())
    this.robotStatus = RobotStatus.from(resHeader.status)

    return {
      errorCode,
      resData,
      resDataSize
    }
  }

  @socket_connect
  handleExtendedCommand(extCommand, reqExtData?, reqExtDataSize?): { errorCode; resData; resDataSize } {
    var { header: reqHeader, buffer } = buildExtReqPacket(extCommand, reqExtData, reqExtDataSize)
    this._send_message(buffer)

    // Recv header from socket
    var resHeader = parsePacketHeader(this._recv_message(Buffer.alloc(SIZE_HEADER_COMMAND)))

    // Recv data from socket
    var resDataSize = resHeader.dataSize
    if (resDataSize > SIZE_DATA_TCP_MAX || resDataSize < 0) {
      console.log(`Response data size is invalid ${resDataSize} (max: {}): Disconnected`)
      this.disconnect()
    } else {
      var resData = this._recv_message(Buffer.alloc(resDataSize))
    }

    // Recv extended data from socket
    var { dataSize: resExtDataSize, command: resExtCmd } = parseExtHeader(resData)

    if (resExtDataSize < 0 || resExtDataSize > TOOMUCH) {
      this.disconnect()
      console.log('Recv data error: size')
    } else if (resExtCmd !== extCommand) {
      this.disconnect()
      console.log(`Recv data error: extCommand ${resExtCmd}/${extCommand}`)
    } else if (resExtDataSize > 0) {
      var resExtData = this._recv_message(Buffer.alloc(resExtDataSize))
    }

    var errorCode = checkHeader(reqHeader, resHeader, resData.readInt32BE())
    this.robotStatus = RobotStatus.from(resHeader.status)

    return {
      errorCode,
      resData,
      resDataSize
    }
  }

  /* Robot command function (Check all) */
  check() {
    // Get robot status
    var { errorCode, resData, resDataSize } = this.handleCommand(CommandCode.CMD_CHECK)
    if (!errorCode) {
      // TODO
    }
  }

  @tcp_command(CommandCode.CMD_EMERGENCY_STOP)
  emergency_stop() {}

  @tcp_command(CommandCode.CMD_RESET_ROBOT)
  reset_robot() {}

  @tcp_command_req(CommandCode.CMD_SET_SERVO, 'bool', this.JOINT_DOF * 1)
  set_servo(arr) {}

  @tcp_command_req(CommandCode.CMD_SET_BRAKE, 'bool', this.JOINT_DOF * 1)
  set_brake(arr) {}

  @tcp_command(CommandCode.CMD_STOP)
  stop_motion() {}

  execute_move(command_name) {
    var reqData = command_name
    var reqDataSize = command_name.length

    return this.handleCommand(CommandCode.CMD_MOVE, reqData, reqDataSize)
  }

  // Move commands
  @tcp_command(CommandCode.CMD_MOVE_HOME)
  go_home() {}

  @tcp_command(CommandCode.CMD_MOVE_ZERO)
  go_zero() {}

  @tcp_command_req(CommandCode.CMD_JOINT_MOVE_TO, 'double', 7 * 8)
  _7dof_joint_move_to(q) {}

  @tcp_command_req(CommandCode.CMD_JOINT_MOVE_TO, 'double', 6 * 8)
  _6dof_joint_move_to(q) {}

  joint_move_to(q) {
    if (this.JOINT_DOF == 7) {
      this._7dof_joint_move_to(q)
    } else {
      this._6dof_joint_move_to(q)
    }
  }

  @tcp_command_req(CommandCode.CMD_JOINT_MOVE_BY, 'double', 7 * 8)
  _7dof_joint_move_by(q) {}

  @tcp_command_req(CommandCode.CMD_JOINT_MOVE_BY, 'double', 6 * 8)
  _6dof_joint_move_by(q) {}

  joint_move_by(q) {
    if (this.JOINT_DOF == 7) {
      this._7dof_joint_move_by(q)
    } else {
      this._6dof_joint_move_by(q)
    }
  }

  @tcp_command_req(CommandCode.CMD_TASK_MOVE_TO, 'double', 6 * 8)
  task_move_to(p) {}

  @tcp_command_req(CommandCode.CMD_TASK_MOVE_BY, 'double', 6 * 8)
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

  @tcp_command_req(CommandCode.CMD_REGISTER_DEFAULT_PROGRAM_IDX, 'int', 4)
  set_default_program(idx) {}

  @tcp_command_rec(CommandCode.CMD_GET_REGISTERED_DEFAULT_PROGRAM_IDX, 'int')
  get_default_program_idx() {}

  // Get robot status
  @tcp_command_rec(CommandCode.CMD_IS_ROBOT_RUNNING, 'bool')
  is_robot_running() {}

  @tcp_command_rec(CommandCode.CMD_IS_READY, 'bool')
  is_robot_ready() {}

  @tcp_command_rec(CommandCode.CMD_IS_EMG, 'bool')
  is_emergency_stop() {}

  @tcp_command_rec(CommandCode.CMD_IS_COLLIDED, 'bool')
  is_collided() {}

  @tcp_command_rec(CommandCode.CMD_IS_ERR, 'bool')
  is_error_state() {}

  @tcp_command_rec(CommandCode.CMD_IS_BUSY, 'bool')
  is_busy() {}

  @tcp_command_rec(CommandCode.CMD_IS_MOVE_FINISEHD, 'bool')
  is_move_finished() {}

  @tcp_command_rec(CommandCode.CMD_IS_HOME, 'bool')
  is_home() {}

  @tcp_command_rec(CommandCode.CMD_IS_ZERO, 'bool')
  is_zero() {}

  @tcp_command_rec(CommandCode.CMD_IS_IN_RESETTING, 'bool')
  is_in_resetting() {}

  @tcp_command_rec(CommandCode.CMD_IS_DIRECT_TECAHING, 'bool')
  is_direct_teaching_mode() {}

  @tcp_command_rec(CommandCode.CMD_IS_TEACHING, 'bool')
  is_teaching_mode() {}

  @tcp_command_rec(CommandCode.CMD_IS_PROGRAM_RUNNING, 'bool')
  is_program_running() {}

  @tcp_command_rec(CommandCode.CMD_IS_PROGRAM_PAUSED, 'bool')
  is_program_paused() {}

  @tcp_command_rec(CommandCode.CMD_IS_CONTY_CONNECTED, 'bool')
  is_conty_connected() {}

  // Direct teaching
  @tcp_command(CommandCode.CMD_CHANGE_DIRECT_TEACHING)
  change_to_direct_teaching() {}

  @tcp_command(CommandCode.CMD_FINISH_DIRECT_TEACHING)
  finish_direct_teaching() {}

  // Simple waypoint program, joint and task.
  // TODO JOINT_DOF 를 접근할 수 없는데...
  @tcp_command_req(CommandCode.CMD_JOINT_PUSH_BACK_WAYPOINT_SET, 'double', 6 * 8)
  push_back_joint_waypoint(q) {}

  @tcp_command(CommandCode.CMD_JOINT_POP_BACK_WAYPOINT_SET)
  pop_back_joint_waypoint() {}

  @tcp_command(CommandCode.CMD_JOINT_CLEAR_WAYPOINT_SET)
  clear_joint_waypoints() {}

  @tcp_command(CommandCode.CMD_JOINT_EXECUTE_WAYPOINT_SET)
  execute_joint_waypoints() {}

  @tcp_command_req(CommandCode.CMD_TASK_PUSH_BACK_WAYPOINT_SET, 'double', 6 * 8)
  push_back_task_waypoint(p) {}

  @tcp_command(CommandCode.CMD_TASK_POP_BACK_WAYPOINT_SET)
  pop_back_task_waypoint() {}

  @tcp_command(CommandCode.CMD_TASK_CLEAR_WAYPOINT_SET)
  clear_task_waypoints() {}

  @tcp_command(CommandCode.CMD_TASK_EXECUTE_WAYPOINT_SET)
  execute_task_waypoints() {}

  // Get/Set some global robot variables
  @tcp_command_req(CommandCode.CMD_SET_DEFAULT_TCP, 'double', 6 * 8)
  set_default_tcp(tcp) {}

  @tcp_command(CommandCode.CMD_RESET_DEFAULT_TCP)
  reset_default_tcp() {}

  @tcp_command_req(CommandCode.CMD_SET_COMP_TCP, 'double', 6 * 8)
  set_tcp_compensation(tcp) {}

  @tcp_command(CommandCode.CMD_RESET_COMP_TCP)
  reset_tcp_compensation() {}

  @tcp_command_req(CommandCode.CMD_SET_REFFRAME, 'double', 6 * 8)
  set_ref_frame(ref) {}

  @tcp_command(CommandCode.CMD_RESET_REFFRAME)
  reset_ref_frame() {}

  @tcp_command_req(CommandCode.CMD_SET_COLLISION_LEVEL, 'int', 4)
  set_collision_level(level) {}

  @tcp_command_req(CommandCode.CMD_SET_JOINT_BOUNDARY, 'int', 4)
  set_joint_speed_level(level) {}

  @tcp_command_req(CommandCode.CMD_SET_TASK_BOUNDARY, 'int', 4)
  set_task_speed_level(level) {}

  @tcp_command_req(CommandCode.CMD_SET_JOINT_WTIME, 'double', 8)
  set_joint_waypoint_time(time) {}

  @tcp_command_req(CommandCode.CMD_SET_TASK_WTIME, 'double', 8)
  set_task_waypoint_time(time) {}

  @tcp_command_req(CommandCode.CMD_SET_TASK_CMODE, 'int', 4)
  set_task_base_mode(mode) {
    // 0: reference body, 1: end-effector tool tip
  }

  @tcp_command_req(CommandCode.CMD_SET_JOINT_BLEND_RADIUS, 'double', 8)
  set_joint_blend_radius(radius) {}

  @tcp_command_req(CommandCode.CMD_SET_TASK_BLEND_RADIUS, 'double', 8)
  set_task_blend_radius(radius) {}

  @tcp_command_rec(CommandCode.CMD_GET_DEFAULT_TCP, 'double')
  get_default_tcp() {}

  @tcp_command_rec(CommandCode.CMD_GET_COMP_TCP, 'double')
  get_tcp_compensation() {}

  @tcp_command_rec(CommandCode.CMD_GET_REFFRAME, 'double')
  get_ref_frame() {}

  @tcp_command_rec(CommandCode.CMD_GET_COLLISION_LEVEL, 'int')
  get_collision_level() {}

  @tcp_command_rec(CommandCode.CMD_GET_JOINT_BOUNDARY, 'int')
  get_joint_speed_level() {}

  @tcp_command_rec(CommandCode.CMD_GET_TASK_BOUNDARY, 'int')
  get_task_speed_level() {}

  @tcp_command_rec(CommandCode.CMD_GET_JOINT_WTIME, 'double')
  get_joint_waypoint_time() {}

  @tcp_command_rec(CommandCode.CMD_GET_TASK_WTIME, 'double')
  get_task_waypoint_time() {}

  @tcp_command_rec(CommandCode.CMD_GET_TASK_CMODE, 'int')
  get_task_base_mode() {}

  @tcp_command_rec(CommandCode.CMD_GET_JOINT_BLEND_RADIUS, 'double')
  get_joint_blend_radius() {}

  @tcp_command_rec(CommandCode.CMD_GET_TASK_BLEND_RADIUS, 'double')
  get_task_blend_radius() {}

  @tcp_command_rec(CommandCode.CMD_GET_RUNNING_TIME, 'double')
  get_robot_running_time() {}

  @tcp_command_rec(CommandCode.CMD_GET_CMODE, 'int')
  get_cmode() {}

  get_servo_state() {
    var { errorCode, resData, resDataSize } = this.handleCommand(CommandCode.CMD_GET_JOINT_STATE)
    if (!errorCode) {
      // result = np.array(resData.char)
      // servo_state = result[0:JOINT_DOF].tolist()
      // brake_state = result[JOINT_DOF:2*JOINT_DOF].tolist()
      // return servo_state, brake_state
    }
  }

  @tcp_command_rec(CommandCode.CMD_GET_JOINT_POSITION, 'double')
  get_joint_pos() {
    if (this.JOINT_DOF == 7) {
      return 'double7dArr'
    } else {
      return 'double'
    }
  }

  @tcp_command_rec(CommandCode.CMD_GET_JOINT_VELOCITY, 'double')
  get_joint_vel() {
    if (this.JOINT_DOF == 7) {
      return 'double7dArr'
    } else {
      return 'double'
    }
  }

  @tcp_command_rec(CommandCode.CMD_GET_TASK_POSITION, 'double')
  get_task_pos() {
    return 'double'
  }

  @tcp_command_rec(CommandCode.CMD_GET_TASK_VELOCITY, 'double')
  get_task_vel() {
    return 'double'
  }

  @tcp_command_rec(CommandCode.CMD_GET_TORQUE, 'double')
  get_torque() {
    return 'double'
  }

  get_last_emergency_info() {
    // Check (TODO: represent meaning of results)
    var { errorCode, resData, resDataSize } = this.handleCommand(CommandCode.CMD_GET_LAST_EMG_INFO)
    if (!errorCode) {
      // ret_code = c_int32()
      // ret_int_arr = (c_int32 * 3)()
      // ret_double_arr = (c_double*3)()
      // memmove(addressof(ret_code), addressof(resData.byte), 4)
      // memmove(addressof(ret_int_arr), addressof(resData.byte) + 4, 4 * 3)
      // memmove(addressof(ret_double_arr), addressof(resData.byte) + 16, 8 * 3)
      // return np.array(ret_code).tolist(), np.array(ret_int_arr).tolist(), np.array(ret_double_arr).tolist()
    }
  }

  // I/O
  @tcp_command_req_rec(CommandCode.CMD_GET_SMART_DI, 'int', 4, 'char')
  get_smart_di(idx) {}

  get_smart_dis() {
    var { errorCode, resData, resDataSize } = this.handleCommand(CommandCode.CMD_GET_SMART_DIS)
    if (errorCode) {
      return errorCode
    } else {
      // return np.array(resData.char).tolist()[0:32]
    }
  }

  set_smart_do(idx, val) {
    var reqDataSize = 5
    var reqData = Buffer.alloc(reqDataSize)

    reqData.writeInt32BE(4 * idx)
    reqData.writeInt8(val)
    //     memmove(reqData.byte, pointer(c_int32(idx)), sizeof(c_int32))
    //     memmove(addressof(reqData.byte)+4, pointer(c_ubyte(val)), sizeof(c_ubyte))
    this.handleCommand(CommandCode.CMD_SET_SMART_DO, reqData, reqDataSize)
  }

  @tcp_command_req(CommandCode.CMD_SET_SMART_DOS, 'char', 32)
  set_smart_dos(idx) {}

  @tcp_command_req_rec(CommandCode.CMD_GET_SMART_AI, 'int', 4, 'int')
  get_smart_ai(idx) {}

  set_smart_ao(idx, val) {
    var reqDataSize = 8
    var reqData = Buffer.alloc(reqDataSize)

    reqData.writeInt32BE(idx)
    reqData.writeInt32BE(val)

    this.handleCommand(CommandCode.CMD_SET_SMART_AO, reqData, reqDataSize)
  }

  @tcp_command_req_rec(CommandCode.CMD_GET_SMART_DO, 'int', 4, 'char')
  get_smart_do(idx) {}

  @tcp_command_rec(CommandCode.CMD_GET_SMART_DOS, 'char')
  get_smart_dos() {}

  @tcp_command_req_rec(CommandCode.CMD_GET_SMART_AO, 'int', 4, 'int')
  get_smart_ao(idx) {}

  set_endtool_do(endtool_type, val) {
    // endtool_type:
    // 0: NPN, 1: PNP, 2: Not use, 3: eModi
    var reqDataSize = 5
    var reqData = Buffer.alloc(reqDataSize)

    reqData.writeInt32BE(endtool_type)
    reqData.writeInt8(val)

    return this.handleCommand(CommandCode.CMD_SET_ENDTOOL_DO, reqData, reqDataSize)
  }

  @tcp_command_req_rec(CommandCode.CMD_GET_ENDTOOL_DO, 'int', 4, 'char')
  get_endtool_do(type) {}

  // FT sensor implementation
  @tcp_command_rec(CommandCode.CMD_GET_EXTIO_FTCAN_ROBOT_RAW, 'int')
  get_robot_ft_sensor_raw() {}

  @tcp_command_rec(CommandCode.CMD_GET_EXTIO_FTCAN_ROBOT_TRANS, 'double')
  get_robot_ft_sensor_process() {}

  @tcp_command_rec(CommandCode.CMD_GET_EXTIO_FTCAN_CB_RAW, 'int')
  get_cb_ft_sensor_raw() {}

  @tcp_command_rec(CommandCode.CMD_GET_EXTIO_FTCAN_CB_TRANS, 'double')
  get_cb_ft_sensor_process() {}

  read_direct_variable(dvType, dvAddr) {
    var reqDataSize = 8
    var reqData = Buffer.alloc(reqDataSize)

    reqData.writeInt32BE(dvType)
    reqData.writeInt32BE(dvAddr)

    var { errorCode, resData, resDataSize } = this.handleCommand(
      CommandCode.CMD_READ_DIRECT_VARIABLE,
      reqData,
      reqDataSize
    )

    if (errorCode) {
      return errorCode
    }

    switch (dvType) {
      case DirectVariableType.BYTE: // B
      // if resDataSize == 1:
      //     return np.array(resData.byteVal)
      case DirectVariableType.WORD: // W
      // if resDataSize == 2:
      //     val = np.array(resData.wordVal).tolist()
      //     console.log(val)
      //     res = int.from_bytes(val, byteorder='little', signed=true)
      //     return res
      case DirectVariableType.DWORD: // I
      // if resDataSize == 4:
      //     val = np.array(resData.dwordVal).tolist()
      //     res = int.from_bytes(val, byteorder='little', signed=true)
      //     return res
      case DirectVariableType.LWORD: // L
      // if resDataSize == 8:
      //     val = np.array(resData.lwordVal).tolist()
      //     res = int.from_bytes(val, byteorder='little', signed=true)
      //     return res
      case DirectVariableType.FLOAT: // F
      // if resDataSize == 4:
      //     return np.array(resData.floatVal)
      case DirectVariableType.DFLOAT: // D
      // if resDataSize == 8:
      //     return np.array(resData.double)
      case DirectVariableType.MODBUS_REG: // M
      // if resDataSize == 2:
      //     val = np.array(resData.uwordVal).tolist()
      //     res = int.from_bytes(val, byteorder='little', signed=false)
      //     return res
      default:
        console.log('None matched type')
        return false
    }
  }

  read_direct_variables(dvType, dvAddr, dvLen) {
    if (dvLen > 20) {
      console.log(`Length should be less than 20, but ${dvLen}`)
      return
    }

    var reqDataSize = 12
    var reqData = Buffer.alloc(reqDataSize)

    reqData.writeInt32BE(dvType)
    reqData.writeInt32BE(dvAddr)
    reqData.writeInt32BE(dvLen)

    var { errorCode, resData, resDataSize } = this.handleCommand(
      CommandCode.CMD_READ_DIRECT_VARIABLES,
      reqData,
      reqDataSize
    )

    if (errorCode) {
      return errorCode
    }

    switch (dvType) {
      case DirectVariableType.BYTE: // B
      // if resDataSize == 1*dvLen:
      //     res = []
      //     for dv_n in range(0, dvLen):
      //         res.append(np.array(resData.byteArr)[dv_n])
      //     return res
      case DirectVariableType.WORD: // W
      // if resDataSize == 2*dvLen:
      //     res = []
      //     for dv_n in range(0, dvLen):
      //         val = np.array(resData.wordArr)[dv_n].tolist()
      //         res.append(int.from_bytes(val, byteorder='little', signed=true))
      //     return res
      case DirectVariableType.DWORD: // I
      // if resDataSize == 4*dvLen:
      //     res = []
      //     for dv_n in range(0, dvLen):
      //         val = np.array(resData.dwordArr)[dv_n].tolist()
      //         res.append(int.from_bytes(val, byteorder='little', signed=true))
      //     return res
      case DirectVariableType.LWORD: // L
      // if resDataSize == 8*dvLen:
      //     res = []
      //     for dv_n in range(0, dvLen):
      //         val = np.array(resData.lwordArr)[dv_n].tolist()
      //         res.append(int.from_bytes(val, byteorder='little', signed=true))
      //     return res
      case DirectVariableType.FLOAT: // F
      // if resDataSize == 4*dvLen:
      //     res = []
      //     for dv_n in range(0, dvLen):
      //         res.append(np.array(resData.floatArr)[dv_n])
      //     return res
      case DirectVariableType.DFLOAT: // D
      // if resDataSize == 8*dvLen:
      //     res = []
      //     for dv_n in range(0, dvLen):
      //         res.append(np.array(resData.doubleArr)[dv_n])
      //     return res
      case DirectVariableType.MODBUS_REG: // M
      // if resDataSize == 2*dvLen:
      //     res = []
      //     for dv_n in range(0, dvLen):
      //         val = np.array(resData.uwordArr)[dv_n].tolist()
      //         res.append(int.from_bytes(val, byteorder='little', signed=false))
      //     return res
      default:
        console.log('None matched type')
        return false
    }
  }

  write_direct_variable(dvType, dvAddr, val) {
    var reqDataSize = 8

    var reqData = Buffer.alloc(reqDataSize)
    reqData.writeInt32BE(dvType)
    reqData.writeInt32BE(dvAddr)

    switch (dvType) {
      case DirectVariableType.BYTE:
      // memmove(addressof(reqData.byte) + 8, pointer(c_uint8(val)), 1)
      // reqDataSize += 1
      // console.log(np.array(reqData.byte))
      // console.log(reqDataSize)
      case DirectVariableType.WORD:
      // memmove(addressof(reqData.byte) + 8, pointer(c_int16(val)), 2)
      // reqDataSize += 2
      // console.log(np.array(reqData.byte))
      // console.log(reqDataSize)
      case DirectVariableType.DWORD:
      // memmove(addressof(reqData.byte) + 8, pointer(c_int32(val)), 4)
      // reqDataSize += 4
      case DirectVariableType.LWORD:
      // memmove(addressof(reqData.byte) + 8, pointer(c_int64(val)), 8)
      // reqDataSize += 8
      case DirectVariableType.FLOAT:
      // memmove(addressof(reqData.byte) + 8, pointer(c_float(val)), 4)
      // reqDataSize += 4
      case DirectVariableType.DFLOAT:
      // memmove(addressof(reqData.byte) + 8, pointer(c_double(val)), 8)
      // reqDataSize += 8
      case DirectVariableType.MODBUS_REG:
      // memmove(addressof(reqData.byte) + 8, pointer(c_uint16(val)), 2)
      // reqDataSize += 2
      default:
        console.log('None matched type')
    }

    this.handleCommand(CommandCode.CMD_WRITE_DIRECT_VARIABLE, reqData, reqDataSize)
  }

  write_direct_variables(dvType, dvAddr, dvLen, val) {
    var reqDataSize = 12
    var reqData = Buffer.alloc(reqDataSize)

    reqData.writeInt32BE(dvType)
    reqData.writeInt32BE(dvAddr)
    reqData.writeInt32BE(dvLen)

    switch (dvType) {
      case DirectVariableType.BYTE:
      // for ii in range(0, dvLen):
      //     memmove(addressof(reqData.byte) + 12 + 1*ii, pointer(c_uint8(val[ii])), 1)
      //     reqDataSize += 1
      case DirectVariableType.WORD:
      // for ii in range(0, dvLen):
      //     type_size = 2
      //     memmove(addressof(reqData.byte) + 12 + type_size*ii, pointer(c_int16(val[ii])), type_size)
      //     reqDataSize += type_size
      case DirectVariableType.DWORD:
      // for ii in range(0, dvLen):
      //     type_size = 4
      //     memmove(addressof(reqData.byte) + 12 + type_size*ii, pointer(c_int32(val[ii])), type_size)
      //     reqDataSize += type_size
      case DirectVariableType.LWORD:
      // for ii in range(0, dvLen):
      //     type_size = 8
      //     memmove(addressof(reqData.byte) + 12 + type_size*ii, pointer(c_int64(val[ii])), type_size)
      //     reqDataSize += type_size
      case DirectVariableType.FLOAT:
      // for ii in range(0, dvLen):
      //     type_size = 4
      //     memmove(addressof(reqData.byte) + 12 + type_size*ii, pointer(c_float(val[ii])), type_size)
      //     reqDataSize += type_size
      case DirectVariableType.DFLOAT:
      // for ii in range(0, dvLen):
      //     type_size = 8
      //     memmove(addressof(reqData.byte) + 12 + type_size*ii, pointer(c_double(val[ii])), type_size)
      //     reqDataSize += type_size
      case DirectVariableType.MODBUS_REG:
      // for ii in range(0, dvLen):
      //     type_size = 2
      //     memmove(addressof(reqData.byte) + 12 + type_size*ii, pointer(c_uint16(val[ii])), type_size)
      //     reqDataSize += type_size
      default:
        console.log('None matched type')
    }

    this.handleCommand(CommandCode.CMD_WRITE_DIRECT_VARIABLES, reqData, reqDataSize)
  }

  // Not released
  @tcp_command_req(CommandCode.CMD_SET_REDUCED_MODE, 'bool', 1)
  set_reduced_mode(mode) {}

  @tcp_command_req(CommandCode.CMD_SET_REDUCED_SPEED_RATIO, 'double', 8)
  set_reduced_speed_ratio(ratio) {}

  @tcp_command_rec(CommandCode.CMD_GET_REDUCED_MODE, 'bool')
  get_reduced_mode() {}

  @tcp_command_rec(CommandCode.CMD_GET_REDUCED_SPEED_RATIO, 'double')
  get_reduced_speed_ratio() {}

  /* Extended IndyDCP command (Check all) */

  move_ext_traj_bin(trajType, trajFreq, datSize, trajData, datNum = 3) {
    var dat_len = trajData.length
    var opt_data = [trajType, trajFreq, datNum, datSize, Math.floor(dat_len / (datSize * datNum))]
    //     ext_data1 = np.array(opt_data).tobytes()
    //     ext_data2 = np.array(trajData).tobytes()
    //     reqExtData = ext_data1 + ext_data2
    //     reqExtDataSize = len(reqExtData)
    // this._handleExtendedCommand(EXT_CommandCode.CMD_MOVE_TRAJ_BY_DATA, reqExtData, reqExtDataSize)
  }

  move_ext_traj_txt(trajType, trajFreq, datSize, trajData, datNum = 3) {
    //     opt_len = 5
    //     dat_len = len(trajData)
    //     ext_dataSize = opt_len + dat_len
    //     ext_data = [None] * ext_dataSize
    //     ext_data[0] = trajType
    //     ext_data[1] = trajFreq
    //     ext_data[2] = datNum
    //     ext_data[3] = datSize
    //     ext_data[4] = Math.floor(dat_len/(datSize*datNum))  # traj_len
    //     ext_data[5:-1] = trajData
    //     ext_data_str = ' '.join(str(e) for e in ext_data)
    //     reqExtData = ext_data_str.encode('ascii')
    //     reqExtDataSize = len(ext_data_str)
    //     this._handleExtendedCommand(EXT_CommandCode.CMD_MOVE_TRAJ_BY_TXT_DATA,
    //                                   reqExtData,
    //                                   reqExtDataSize)
  }

  move_ext_traj_bin_file(filename) {
    //     filename += "\0"  # last char should be null
    //     reqExtData = filename.encode('ascii')
    //     reqExtDataSize = len(filename)
    //     this._handleExtendedCommand(EXT_CommandCode.CMD_MOVE_TRAJ_BY_FILE,
    //                                   reqExtData,
    //                                   reqExtDataSize)
  }

  move_ext_traj_txt_file(filename) {
    //     filename += "\0"  # last char should be null
    //     reqExtData = filename.encode('ascii')
    //     reqExtDataSize = len(filename)
    //     this._handleExtendedCommand(EXT_CommandCode.CMD_MOVE_TRAJ_BY_TXT_FILE,
    //                                   reqExtData,
    //                                   reqExtDataSize)
  }

  joint_move_to_wp_set() {}

  task_move_to_wp_set() {}

  /* JSON programming added (only for internal engineer) */
  set_json_program() {}

  set_and_start_json_program(jsonString) {
    //     jsonString += "\0"
    //     reqExtData = jsonString.encode('ascii')
    //     reqExtDataSize = len(jsonString)
    //     this._handleExtendedCommand(EXT_CommandCode.CMD_SET_JSON_PROG_START,
    //                                   reqExtData,
    //                                   reqExtDataSize)
  }

  wait_for_program_finish() {
    //     while this.is_program_running():
    //         pass
    //     console.log('Program Finished: ', GLOBAL_DICT['stop'])
    //     return GLOBAL_DICT['stop']
  }

  set_workspace(commandPos) {
    //     if np.all(commandPos != 0):
    //         return true
    //     else:
    //         return false
  }

  /* Teaching points */
  load_teaching_data(filename) {
    //     with open(filename, "r") as jsonFile:
    //         teachConfig = json.load(jsonFile)
    //         return teachConfig
  }

  update_teaching_data(filename, wpName, j_pos) {
    //     newPos = []
    //     for pos in j_pos:
    //         newPos.append(float(pos))
    //     teach_data = {wpName: newPos}
    //     # If not an exist file
    //     if not os.path.isfile(filename):
    //         with open(filename, "w+") as f:
    //             json.dump(teach_data, f)
    //             return teach_data
    //     #
    //     with open(filename, "r") as jsonFile:
    //         teachConfig = json.load(jsonFile)
    //         teachConfig.update(teach_data)
    //     with open(filename, "w+") as jsonFile:
    //         json.dump(teachConfig, jsonFile)
    //         return teachConfig
  }

  del_teaching_data(filename, wpName) {
    //     with open(filename) as jsonFile:
    //         teachConfig = json.load(jsonFile)
    //         del teachConfig[wpName]
    //     with open(filename, 'w') as f:
    //         json.dump(teachConfig, f)
    //     return teachConfig
  }
}
