import { Socket } from 'net'
import PromiseSocket from 'promise-socket'
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
import { mutex, packet, extpacket } from './decorators'

/* Indy Client Class */
export class IndyDCPClient implements IIndyDCPClient {
  public JOINT_DOF
  public lock
  public socket
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
    this.socket
    this.timeout = 10
    this.invokeId = 0
    this.serverIp = serverIp
    this.robotName = robotName
    this.robotVersion = robotVersion

    this.JOINT_DOF = this.robotName == ROBOT_INDYRP2 ? 7 : 6
  }

  async connect() {
    this.socket = new PromiseSocket(new Socket())
    // this.socket.setEncoding('utf8')

    await this.socket.connect(this.__server_port, this.serverIp)

    console.log(`Connect: Server IP (${this.serverIp})`)
  }

  disconnect() {
    this.socket && this.socket.destroy()
    this.socket = null
    // this.__lock?.release()
  }

  shutdown() {
    this.disconnect()
  }

  setTimeoutSec(timeout) {
    if (timeout < 0) {
      console.log(`Invalid time out setting: ${timeout} < 0`)
    }

    this.timeout = timeout
  }

  async _sendMessage(buf, size?) {
    await this.socket.write(buf, size || buf.length)
  }

  async _recvMessage(size) {
    var message = await this.socket.read(size)
    if (!message) {
      throw new Error('socket closed')
    }
    return message
  }

  async getRobotStatus() {
    await this.check()
    return this.robotStatus
  }

  @mutex
  async handleCommand(command, reqBuffer?, reqBufferSize?): Promise<{ errorCode; resData; resDataSize }> {
    var { header: reqHeader, buffer } = buildReqPacket(this, command, reqBuffer, reqBufferSize)
    await this._sendMessage(buffer)

    // Recv header from socket
    var resHeader = parsePacketHeader(await this._recvMessage(SIZE_HEADER_COMMAND))

    // Recv data from socket
    var resDataSize = resHeader.dataSize

    if (resDataSize > SIZE_DATA_TCP_MAX || resDataSize < 0) {
      console.log(`Response data size is invalid ${resDataSize} (max: {}): Disconnected`)
      this.disconnect()
    } else if (resDataSize > 0) {
      var resData = await this._recvMessage(resDataSize)
    }

    this.robotStatus = RobotStatus.from(resHeader.status)
    var errorCode = checkHeader(reqHeader, resHeader, this.robotStatus.is_error_state && resData?.readInt32LE(0))

    return {
      errorCode,
      resData,
      resDataSize
    }
  }

  @mutex
  async handleExtendedCommand(extCommand, reqExtData?, reqExtDataSize?): Promise<{ errorCode; resData; resDataSize }> {
    var { header: reqHeader, buffer } = buildExtReqPacket(extCommand, reqExtData, reqExtDataSize)
    await this._sendMessage(buffer)

    // Recv header from socket
    var resHeader = parsePacketHeader(await this._recvMessage(SIZE_HEADER_COMMAND))

    // Recv data from socket
    var resDataSize = resHeader.dataSize
    if (resDataSize > SIZE_DATA_TCP_MAX || resDataSize < 0) {
      console.log(`Response data size is invalid ${resDataSize} (max: {}): Disconnected`)
      this.disconnect()
    } else {
      var resData = await this._recvMessage(resDataSize)
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
      var resExtData = await this._recvMessage(Buffer.alloc(resExtDataSize))
    }

    this.robotStatus = RobotStatus.from(resHeader.status)
    var errorCode = checkHeader(reqHeader, resHeader, this.robotStatus.is_error_state && resData?.readInt32LE(0))

    return {
      errorCode,
      resData,
      resDataSize
    }
  }

  /* Robot command function (Check all) */
  async check() {
    // Get robot status
    var { errorCode, resData, resDataSize } = await this.handleCommand(CommandCode.CMD_CHECK)
    console.log('check()', errorCode, resData, resDataSize)
    if (!errorCode) {
      // TODO
    }
  }

  @packet(CommandCode.CMD_EMERGENCY_STOP)
  emergency_stop() {}

  @packet(CommandCode.CMD_RESET_ROBOT)
  reset_robot() {}

  @packet(CommandCode.CMD_SET_SERVO, 'bools' /* this.JOINT_DOF * 1 */)
  set_servo(arr) {}

  @packet(CommandCode.CMD_SET_BRAKE, 'bools' /* this.JOINT_DOF * 1 */)
  set_brake(arr) {}

  @packet(CommandCode.CMD_STOP)
  stop_motion() {}

  @packet(CommandCode.CMD_MOVE, 'string')
  execute_move(command_name) {}

  // Move commands
  @packet(CommandCode.CMD_MOVE_HOME)
  go_home() {}

  @packet(CommandCode.CMD_MOVE_ZERO)
  go_zero() {}

  @packet(CommandCode.CMD_JOINT_MOVE_TO, 'doubles' /* 7 * 8 */)
  _7dof_joint_move_to(q) {}

  @packet(CommandCode.CMD_JOINT_MOVE_TO, 'doubles' /* 6 * 8 */)
  _6dof_joint_move_to(q) {}

  joint_move_to(q) {
    if (this.JOINT_DOF == 7) {
      this._7dof_joint_move_to(q)
    } else {
      this._6dof_joint_move_to(q)
    }
  }

  @packet(CommandCode.CMD_JOINT_MOVE_BY, 'doubles' /* 7 * 8 */)
  _7dof_joint_move_by(q) {}

  @packet(CommandCode.CMD_JOINT_MOVE_BY, 'doubles' /* 6 * 8 */)
  _6dof_joint_move_by(q) {}

  joint_move_by(q) {
    if (this.JOINT_DOF == 7) {
      this._7dof_joint_move_by(q)
    } else {
      this._6dof_joint_move_by(q)
    }
  }

  @packet(CommandCode.CMD_TASK_MOVE_TO, 'doubles' /* 6 * 8 */)
  task_move_to(p) {}

  @packet(CommandCode.CMD_TASK_MOVE_BY, 'doubles' /* 6 * 8 */)
  task_move_by(p) {}

  // Program control
  @packet(CommandCode.CMD_START_CURRENT_PROGRAM)
  start_current_program() {}

  @packet(CommandCode.CMD_PAUSE_CURRENT_PROGRAM)
  pause_current_program() {}

  @packet(CommandCode.CMD_RESUME_CURRENT_PROGRAM)
  resume_current_program() {}

  @packet(CommandCode.CMD_STOP_CURRENT_PROGRAM)
  stop_current_program() {}

  @packet(CommandCode.CMD_START_DEFAULT_PROGRAM)
  start_default_program() {}

  @packet(CommandCode.CMD_REGISTER_DEFAULT_PROGRAM_IDX, 'int')
  set_default_program(idx) {}

  @packet(CommandCode.CMD_GET_REGISTERED_DEFAULT_PROGRAM_IDX, null, 'int')
  get_default_program_idx() {}

  // Get robot status
  @packet(CommandCode.CMD_IS_ROBOT_RUNNING, null, 'bool')
  is_robot_running() {}

  @packet(CommandCode.CMD_IS_READY, null, 'bool')
  is_robot_ready() {}

  @packet(CommandCode.CMD_IS_EMG, null, 'bool')
  is_emergency_stop() {}

  @packet(CommandCode.CMD_IS_COLLIDED, null, 'bool')
  is_collided() {}

  @packet(CommandCode.CMD_IS_ERR, null, 'bool')
  is_error_state() {}

  @packet(CommandCode.CMD_IS_BUSY, null, 'bool')
  is_busy() {}

  @packet(CommandCode.CMD_IS_MOVE_FINISEHD, null, 'bool')
  is_move_finished() {}

  @packet(CommandCode.CMD_IS_HOME, null, 'bool')
  is_home() {}

  @packet(CommandCode.CMD_IS_ZERO, null, 'bool')
  is_zero() {}

  @packet(CommandCode.CMD_IS_IN_RESETTING, null, 'bool')
  is_in_resetting() {}

  @packet(CommandCode.CMD_IS_DIRECT_TECAHING, null, 'bool')
  is_direct_teaching_mode() {}

  @packet(CommandCode.CMD_IS_TEACHING, null, 'bool')
  is_teaching_mode() {}

  @packet(CommandCode.CMD_IS_PROGRAM_RUNNING, null, 'bool')
  is_program_running() {}

  @packet(CommandCode.CMD_IS_PROGRAM_PAUSED, null, 'bool')
  is_program_paused() {}

  @packet(CommandCode.CMD_IS_CONTY_CONNECTED, null, 'bool')
  is_conty_connected() {}

  // Direct teaching
  @packet(CommandCode.CMD_CHANGE_DIRECT_TEACHING)
  change_to_direct_teaching() {}

  @packet(CommandCode.CMD_FINISH_DIRECT_TEACHING)
  finish_direct_teaching() {}

  // Simple waypoint program, joint and task.
  @packet(CommandCode.CMD_JOINT_PUSH_BACK_WAYPOINT_SET, 'doubles' /* 6 * 8 */)
  push_back_joint_waypoint(q) {}

  @packet(CommandCode.CMD_JOINT_POP_BACK_WAYPOINT_SET)
  pop_back_joint_waypoint() {}

  @packet(CommandCode.CMD_JOINT_CLEAR_WAYPOINT_SET)
  clear_joint_waypoints() {}

  @packet(CommandCode.CMD_JOINT_EXECUTE_WAYPOINT_SET)
  execute_joint_waypoints() {}

  @packet(CommandCode.CMD_TASK_PUSH_BACK_WAYPOINT_SET, 'doubles' /* 6 * 8 */)
  push_back_task_waypoint(p) {}

  @packet(CommandCode.CMD_TASK_POP_BACK_WAYPOINT_SET)
  pop_back_task_waypoint() {}

  @packet(CommandCode.CMD_TASK_CLEAR_WAYPOINT_SET)
  clear_task_waypoints() {}

  @packet(CommandCode.CMD_TASK_EXECUTE_WAYPOINT_SET)
  execute_task_waypoints() {}

  // Get/Set some global robot variables
  @packet(CommandCode.CMD_SET_DEFAULT_TCP, 'doubles' /* 6 * 8 */)
  set_default_tcp(tcp) {}

  @packet(CommandCode.CMD_RESET_DEFAULT_TCP)
  reset_default_tcp() {}

  @packet(CommandCode.CMD_SET_COMP_TCP, 'doubles' /* 6 * 8 */)
  set_tcp_compensation(tcp) {}

  @packet(CommandCode.CMD_RESET_COMP_TCP)
  reset_tcp_compensation() {}

  @packet(CommandCode.CMD_SET_REFFRAME, 'doubles' /* 6 * 8 */)
  set_ref_frame(ref) {}

  @packet(CommandCode.CMD_RESET_REFFRAME)
  reset_ref_frame() {}

  @packet(CommandCode.CMD_SET_COLLISION_LEVEL, 'int')
  set_collision_level(level) {}

  @packet(CommandCode.CMD_SET_JOINT_BOUNDARY, 'int')
  set_joint_speed_level(level) {}

  @packet(CommandCode.CMD_SET_TASK_BOUNDARY, 'int')
  set_task_speed_level(level) {}

  @packet(CommandCode.CMD_SET_JOINT_WTIME, 'double')
  set_joint_waypoint_time(time) {}

  @packet(CommandCode.CMD_SET_TASK_WTIME, 'double')
  set_task_waypoint_time(time) {}

  @packet(CommandCode.CMD_SET_TASK_CMODE, 'int')
  set_task_base_mode(mode /* TaskBaseMode */) {}

  @packet(CommandCode.CMD_SET_JOINT_BLEND_RADIUS, 'double')
  set_joint_blend_radius(radius) {}

  @packet(CommandCode.CMD_SET_TASK_BLEND_RADIUS, 'double')
  set_task_blend_radius(radius) {}

  @packet(CommandCode.CMD_GET_DEFAULT_TCP, null, 'double')
  get_default_tcp() {}

  @packet(CommandCode.CMD_GET_COMP_TCP, null, 'double')
  get_tcp_compensation() {}

  @packet(CommandCode.CMD_GET_REFFRAME, null, 'double')
  get_ref_frame() {}

  @packet(CommandCode.CMD_GET_COLLISION_LEVEL, null, 'int')
  get_collision_level() {}

  @packet(CommandCode.CMD_GET_JOINT_BOUNDARY, null, 'int')
  get_joint_speed_level() {}

  @packet(CommandCode.CMD_GET_TASK_BOUNDARY, null, 'int')
  get_task_speed_level() {}

  @packet(CommandCode.CMD_GET_JOINT_WTIME, null, 'double')
  get_joint_waypoint_time() {}

  @packet(CommandCode.CMD_GET_TASK_WTIME, null, 'double')
  get_task_waypoint_time() {}

  @packet(CommandCode.CMD_GET_TASK_CMODE, null, 'int')
  get_task_base_mode() {}

  @packet(CommandCode.CMD_GET_JOINT_BLEND_RADIUS, null, 'double')
  get_joint_blend_radius() {}

  @packet(CommandCode.CMD_GET_TASK_BLEND_RADIUS, null, 'double')
  get_task_blend_radius() {}

  @packet(CommandCode.CMD_GET_RUNNING_TIME, null, 'double')
  get_robot_running_time() {}

  @packet(CommandCode.CMD_GET_CMODE, null, 'int')
  get_cmode() {}

  @packet(CommandCode.CMD_GET_JOINT_STATE, null, 'bools')
  get_servo_state() {
    return {
      deserializer: value => {
        return {
          servoState: value.slice(0, this.JOINT_DOF),
          brakeState: value.slice(this.JOINT_DOF)
        }
      }
    }
  }

  @packet(CommandCode.CMD_GET_JOINT_POSITION, null, 'doubles')
  get_joint_pos() {}

  @packet(CommandCode.CMD_GET_JOINT_VELOCITY, null, 'doubles')
  get_joint_vel() {}

  @packet(CommandCode.CMD_GET_TASK_POSITION, null, 'doubles')
  get_task_pos() {}

  @packet(CommandCode.CMD_GET_TASK_VELOCITY, null, 'doubles')
  get_task_vel() {}

  @packet(CommandCode.CMD_GET_TORQUE, null, 'doubles')
  get_torque() {}

  @packet(CommandCode.CMD_GET_LAST_EMG_INFO)
  get_last_emergency_info() {
    // Check (TODO: represent meaning of results)
    return {
      deserializer(buffer) {
        return {
          code: buffer.readInt32LE(0),
          int_array: [
            // 3 integers
            buffer.readInt32LE(4 + 0 * 4),
            buffer.readInt32LE(4 + 1 * 4),
            buffer.readInt32LE(4 + 2 * 4)
          ],
          double_array: [
            // 3 doubles
            buffer.readDoubleLE(4 + 12 + 0 * 8),
            buffer.readDoubleLE(4 + 12 + 1 * 8),
            buffer.readDoubleLE(4 + 12 + 2 * 8)
          ]
        }
      }
    }
  }

  // I/O
  @packet(CommandCode.CMD_GET_SMART_DI, 'int', 'char')
  get_smart_di(idx) {}

  @packet(CommandCode.CMD_GET_SMART_DIS, null, 'bools')
  get_smart_dis() {}

  @packet(CommandCode.CMD_SET_SMART_DO, ['int', 'bool'])
  set_smart_do(idx, val) {}

  @packet(CommandCode.CMD_SET_SMART_DOS, 'bools' /* 32 */)
  set_smart_dos(idx) {}

  @packet(CommandCode.CMD_GET_SMART_AI, 'int', 'int')
  get_smart_ai(idx) {}

  @packet(CommandCode.CMD_SET_SMART_AO, ['int', 'int'])
  set_smart_ao(idx, val) {}

  @packet(CommandCode.CMD_GET_SMART_DO, 'int', 'bool')
  get_smart_do(idx) {}

  @packet(CommandCode.CMD_GET_SMART_DOS, null, 'bools')
  get_smart_dos() {}

  @packet(CommandCode.CMD_GET_SMART_AO, 'int', 'int')
  get_smart_ao(idx) {}

  @packet(CommandCode.CMD_SET_ENDTOOL_DO, ['int', 'bool'])
  set_endtool_do(endtool_type /* EndToolType */, val) {}

  @packet(CommandCode.CMD_GET_ENDTOOL_DO, 'int', 'bool')
  get_endtool_do(type /* EndToolType */) {}

  // FT sensor implementation
  @packet(CommandCode.CMD_GET_EXTIO_FTCAN_ROBOT_RAW, null, 'int')
  get_robot_ft_sensor_raw() {}

  @packet(CommandCode.CMD_GET_EXTIO_FTCAN_ROBOT_TRANS, null, 'double')
  get_robot_ft_sensor_process() {}

  @packet(CommandCode.CMD_GET_EXTIO_FTCAN_CB_RAW, null, 'int')
  get_cb_ft_sensor_raw() {}

  @packet(CommandCode.CMD_GET_EXTIO_FTCAN_CB_TRANS, null, 'double')
  get_cb_ft_sensor_process() {}

  @packet(CommandCode.CMD_READ_DIRECT_VARIABLE, ['int', 'int'], 'buffer')
  async read_direct_variable(dvType, dvAddr) {
    return {
      deserializer(buffer: Buffer) {
        switch (dvType) {
          case DirectVariableType.BYTE: // B
            return buffer.readInt8(0)
          case DirectVariableType.WORD: // W
            return buffer.readInt16LE(0)
          case DirectVariableType.DWORD: // I
            return buffer.readInt32LE(0)
          case DirectVariableType.LWORD: // L
            return buffer.readBigInt64LE(0)
          case DirectVariableType.FLOAT: // F
            return buffer.readFloatLE(0)
          case DirectVariableType.DFLOAT: // D
            return buffer.readDoubleLE
          case DirectVariableType.MODBUS_REG: // M
            return buffer.readUInt16LE(0)
          default:
            console.log('None matched type')
            return false
        }
      }
    }
  }

  @packet(CommandCode.CMD_READ_DIRECT_VARIABLES, ['int', 'int', 'int'], 'buffer')
  read_direct_variables(dvType, dvAddr, dvLen) {
    return {
      deserializer(buffer: Buffer) {
        var size = buffer.length
        var array = []

        switch (dvType) {
          case DirectVariableType.BYTE: // B
            // ASSERT(size == dvLen * 1)
            for (let i = 0; i < dvLen; i++) {
              array.push(buffer.readInt8(i * 1))
            }
            return array
          case DirectVariableType.WORD: // W
            // ASSERT(size == dvLen * 2)
            for (let i = 0; i < dvLen; i++) {
              array.push(buffer.readInt16LE(i * 2))
            }
            return array
          case DirectVariableType.DWORD: // I
            // ASSERT(size == dvLen * 4)
            for (let i = 0; i < dvLen; i++) {
              array.push(buffer.readInt32LE(i * 4))
            }
            return array
          case DirectVariableType.LWORD: // L
            // ASSERT(size == dvLen * 8)
            for (let i = 0; i < dvLen; i++) {
              array.push(buffer.readBigInt64LE(i * 8))
            }
            return array
          case DirectVariableType.FLOAT: // F
            // ASSERT(size == dvLen * 4)
            for (let i = 0; i < dvLen; i++) {
              array.push(buffer.readFloatLE(i * 4))
            }
            return array
          case DirectVariableType.DFLOAT: // D
            // ASSERT(size == dvLen * 8)
            for (let i = 0; i < dvLen; i++) {
              array.push(buffer.readDoubleLE(i * 8))
            }
            return array
          case DirectVariableType.MODBUS_REG: // M
            // ASSERT(size == dvLen * 2)
            for (let i = 0; i < dvLen; i++) {
              array.push(buffer.readUInt16LE(i * 2))
            }
            return array
          default:
            console.log('None matched type')
            return false
        }
      }
    }
  }

  @packet(CommandCode.CMD_WRITE_DIRECT_VARIABLE)
  write_direct_variable(dvType, dvAddr, val) {
    return {
      serializer() {
        var buffer
        switch (dvType) {
          case DirectVariableType.BYTE:
            buffer = Buffer.alloc(8 + 1)
            buffer.writeInt8(val, 8)
            break
          case DirectVariableType.WORD:
            buffer = Buffer.alloc(8 + 2)
            buffer.writeInt16LE(val, 8)
            break
          case DirectVariableType.DWORD:
            buffer = Buffer.alloc(8 + 4)
            buffer.writeInt32LE(val, 8)
            break
          case DirectVariableType.LWORD:
            buffer = Buffer.alloc(8 + 8)
            buffer.writeBigInt64LE(val, 8)
            break
          case DirectVariableType.FLOAT:
            buffer = Buffer.alloc(8 + 4)
            buffer.writeFloatLE(val, 8)
            break
          case DirectVariableType.DFLOAT:
            buffer = Buffer.alloc(8 + 8)
            buffer.writeDoubleLE(val, 8)
            break
          case DirectVariableType.MODBUS_REG:
            buffer = Buffer.alloc(8 + 2)
            buffer.writeUInt16LE(val, 8)
            break
          default:
            throw new Error('None matched type')
        }

        buffer.writeInt32LE(dvType, 0)
        buffer.writeInt32LE(dvAddr, 4)

        return buffer
      }
    }
  }

  @packet(CommandCode.CMD_WRITE_DIRECT_VARIABLES)
  write_direct_variables(dvType, dvAddr, dvLen, val) {
    return {
      serializer() {
        var buffer

        switch (dvType) {
          case DirectVariableType.BYTE:
            buffer = Buffer.alloc(4 * dvLen + 12)
            val.forEach((x, i) => buffer.writeInt8LE(x, i * 1 + 12))
            break
          case DirectVariableType.WORD:
            buffer = Buffer.alloc(2 * dvLen + 12)
            val.forEach((x, i) => buffer.writeInt16LE(x, i * 2 + 12))
            break
          case DirectVariableType.DWORD:
            buffer = Buffer.alloc(4 * dvLen + 12)
            val.forEach((x, i) => buffer.writeInt32LE(x, i * 4 + 12))
            break
          case DirectVariableType.LWORD:
            buffer = Buffer.alloc(8 * dvLen + 12)
            val.forEach((x, i) => buffer.writeBigInt64LE(x, i * 8 + 12))
            break
          case DirectVariableType.FLOAT:
            buffer = Buffer.alloc(4 * dvLen + 12)
            val.forEach((x, i) => buffer.writeFloatLE(x, i * 4 + 12))
            break
          case DirectVariableType.DFLOAT:
            buffer = Buffer.alloc(8 * dvLen + 12)
            val.forEach((x, i) => buffer.writeDoubleLE(x, i * 8 + 12))
            break
          case DirectVariableType.MODBUS_REG:
            buffer = Buffer.alloc(2 * dvLen + 12)
            val.forEach((x, i) => buffer.writeUInt32LE(x, i * 2 + 12))
            break
          default:
            throw new Error('None matched type')
        }

        buffer.writeInt32LE(dvType)
        buffer.writeInt32LE(dvAddr)
        buffer.writeInt32LE(dvLen)

        return buffer
      }
    }
  }

  // Not released
  @packet(CommandCode.CMD_SET_REDUCED_MODE, 'bool')
  set_reduced_mode(mode) {}

  @packet(CommandCode.CMD_SET_REDUCED_SPEED_RATIO, 'double')
  set_reduced_speed_ratio(ratio) {}

  @packet(CommandCode.CMD_GET_REDUCED_MODE, null, 'bool')
  get_reduced_mode() {}

  @packet(CommandCode.CMD_GET_REDUCED_SPEED_RATIO, null, 'double')
  get_reduced_speed_ratio() {}

  /* Extended IndyDCP command (Check all) */

  @extpacket(CommandCode.EXT_CMD_MOVE_TRAJ_BY_DATA)
  move_ext_traj_bin(trajType, trajFreq, datSize, trajData, datNum = 3) {
    return {
      serializer() {
        var buffer = Buffer.alloc(4 + 4 + 4 + 4 + 4)

        buffer.writeInt32LE(trajType, 0)
        buffer.writeInt32LE(trajFreq, 4)
        buffer.writeInt32LE(datNum, 8)
        buffer.writeInt32LE(datSize, 12)
        buffer.writeInt32LE(Math.floor(trajData.length / (datSize * datNum)), 16)

        return Buffer.concat([buffer, Buffer.from(trajData)])
      }
    }
  }

  @extpacket(CommandCode.EXT_CMD_MOVE_TRAJ_BY_TXT_DATA)
  move_ext_traj_txt(trajType, trajFreq, datSize, trajData, datNum = 3) {
    return {
      serializer() {
        var data = [
          trajType,
          trajFreq,
          datNum,
          datSize,
          Math.floor(trajData.len / (datSize * datNum)),
          trajData.toString()
        ]
          .map(d => String(d))
          .join(' ')
        return Buffer.from(data)
      }
    }
  }

  @extpacket(CommandCode.EXT_CMD_MOVE_TRAJ_BY_FILE)
  move_ext_traj_bin_file(filename) {
    return {
      serializer() {
        return Buffer.from(filename + '\0')
      }
    }
  }

  @extpacket(CommandCode.EXT_CMD_MOVE_TRAJ_BY_TXT_FILE)
  move_ext_traj_txt_file(filename) {
    return {
      serializer() {
        return Buffer.from(filename + '\0')
      }
    }
  }

  joint_move_to_wp_set() {}

  task_move_to_wp_set() {}

  /* JSON programming added (only for internal engineer) */
  set_json_program() {}

  @extpacket(CommandCode.EXT_CMD_SET_JSON_PROG_START, 'string')
  set_and_start_json_program(jsonString) {
    return {
      serializer() {
        return Buffer.from(jsonString + '\0')
      }
    }
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
