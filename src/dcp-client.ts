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

  private _serverPort
  private _lock

  constructor(serverIp, robotName, robotVersion = '') {
    this._serverPort = 6066
    this.sofServer = 0x12
    this.sofClient = 0x34
    this.stepInfo = 0x02
    this._lock = new AwaitLock()

    this.lock = this._lock
    this.socket
    this.timeout = 10
    this.invokeId = 0
    this.serverIp = serverIp
    this.robotName = robotName
    this.robotVersion = robotVersion

    this.JOINT_DOF = this.robotName == ROBOT_INDYRP2 ? 7 : 6
  }

  async connect() {
    var socket = new PromiseSocket(new Socket())

    // socket.setEncoding('utf8')
    socket.setTimeout(5000)
    await socket.connect(this._serverPort, this.serverIp)

    this.socket = socket
    console.log(`Connect: Server IP (${this.serverIp})`)
  }

  disconnect() {
    this.socket && this.socket.destroy()
    this.socket = null
    // this._lock?.release()
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
    var errorCode = checkHeader(reqHeader, resHeader, this.robotStatus.is_errorState && resData?.readInt32LE(0))

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
    var errorCode = checkHeader(reqHeader, resHeader, this.robotStatus.is_errorState && resData?.readInt32LE(0))

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
  emergencyStop() {}

  @packet(CommandCode.CMD_RESET_ROBOT)
  resetRobot() {}

  @packet(CommandCode.CMD_SET_SERVO, 'bools' /* this.JOINT_DOF * 1 */)
  setServo(arr) {}

  @packet(CommandCode.CMD_SET_BRAKE, 'bools' /* this.JOINT_DOF * 1 */)
  setBrake(arr) {}

  @packet(CommandCode.CMD_STOP)
  stopMotion() {}

  @packet(CommandCode.CMD_MOVE, 'string')
  executeMove(command_name) {}

  // Move commands
  @packet(CommandCode.CMD_MOVE_HOME)
  goHome() {}

  @packet(CommandCode.CMD_MOVE_ZERO)
  goZero() {}

  @packet(CommandCode.CMD_JOINT_MOVE_TO, 'doubles' /* 7 * 8 */)
  _7dofJointMoveTo(q) {}

  @packet(CommandCode.CMD_JOINT_MOVE_TO, 'doubles' /* 6 * 8 */)
  _6dofJointMoveTo(q) {}

  jointMoveTo(q) {
    if (this.JOINT_DOF == 7) {
      this._7dofJointMoveTo(q)
    } else {
      this._6dofJointMoveTo(q)
    }
  }

  @packet(CommandCode.CMD_JOINT_MOVE_BY, 'doubles' /* 7 * 8 */)
  _7dofJointMoveBy(q) {}

  @packet(CommandCode.CMD_JOINT_MOVE_BY, 'doubles' /* 6 * 8 */)
  _6dofJointMoveBy(q) {}

  jointMoveBy(q) {
    if (this.JOINT_DOF == 7) {
      this._7dofJointMoveBy(q)
    } else {
      this._6dofJointMoveBy(q)
    }
  }

  @packet(CommandCode.CMD_TASK_MOVE_TO, 'doubles' /* 6 * 8 */)
  taskMoveTo(p) {}

  @packet(CommandCode.CMD_TASK_MOVE_BY, 'doubles' /* 6 * 8 */)
  taskMoveBy(p) {}

  // Program control
  @packet(CommandCode.CMD_START_CURRENT_PROGRAM)
  startCurrentProgram() {}

  @packet(CommandCode.CMD_PAUSE_CURRENT_PROGRAM)
  pauseCurrentProgram() {}

  @packet(CommandCode.CMD_RESUME_CURRENT_PROGRAM)
  resumeCurrentProgram() {}

  @packet(CommandCode.CMD_STOP_CURRENT_PROGRAM)
  stopCurrentProgram() {}

  @packet(CommandCode.CMD_START_DEFAULT_PROGRAM)
  startDefaultProgram() {}

  @packet(CommandCode.CMD_REGISTER_DEFAULT_PROGRAM_IDX, 'int')
  setDefaultProgram(idx) {}

  @packet(CommandCode.CMD_GET_REGISTERED_DEFAULT_PROGRAM_IDX, null, 'int')
  getDefaultProgramIdx() {}

  // Get robot status
  @packet(CommandCode.CMD_IS_ROBOT_RUNNING, null, 'bool')
  isRobotRunning() {}

  @packet(CommandCode.CMD_IS_READY, null, 'bool')
  isRobotReady() {}

  @packet(CommandCode.CMD_IS_EMG, null, 'bool')
  isEmergencyStop() {}

  @packet(CommandCode.CMD_IS_COLLIDED, null, 'bool')
  isCollided() {}

  @packet(CommandCode.CMD_IS_ERR, null, 'bool')
  isErrorState() {}

  @packet(CommandCode.CMD_IS_BUSY, null, 'bool')
  isBusy() {}

  @packet(CommandCode.CMD_IS_MOVE_FINISEHD, null, 'bool')
  isMoveFinished() {}

  @packet(CommandCode.CMD_IS_HOME, null, 'bool')
  isHome() {}

  @packet(CommandCode.CMD_IS_ZERO, null, 'bool')
  isZero() {}

  @packet(CommandCode.CMD_IS_IN_RESETTING, null, 'bool')
  isInResetting() {}

  @packet(CommandCode.CMD_IS_DIRECT_TECAHING, null, 'bool')
  isDirectTeachingMode() {}

  @packet(CommandCode.CMD_IS_TEACHING, null, 'bool')
  isTeachingMode() {}

  @packet(CommandCode.CMD_IS_PROGRAM_RUNNING, null, 'bool')
  isProgramRunning() {}

  @packet(CommandCode.CMD_IS_PROGRAM_PAUSED, null, 'bool')
  isProgramPaused() {}

  @packet(CommandCode.CMD_IS_CONTY_CONNECTED, null, 'bool')
  isContyConnected() {}

  // Direct teaching
  @packet(CommandCode.CMD_CHANGE_DIRECT_TEACHING)
  changeToDirectTeaching() {}

  @packet(CommandCode.CMD_FINISH_DIRECT_TEACHING)
  finishDirectTeaching() {}

  // Simple waypoint program, joint and task.
  @packet(CommandCode.CMD_JOINT_PUSH_BACK_WAYPOINT_SET, 'doubles' /* 6 * 8 */)
  pushBackJointWaypoint(q) {}

  @packet(CommandCode.CMD_JOINT_POP_BACK_WAYPOINT_SET)
  popBackJointWaypoint() {}

  @packet(CommandCode.CMD_JOINT_CLEAR_WAYPOINT_SET)
  clearJointWaypoints() {}

  @packet(CommandCode.CMD_JOINT_EXECUTE_WAYPOINT_SET)
  executeJointWaypoints() {}

  @packet(CommandCode.CMD_TASK_PUSH_BACK_WAYPOINT_SET, 'doubles' /* 6 * 8 */)
  pushBackTaskWaypoint(p) {}

  @packet(CommandCode.CMD_TASK_POP_BACK_WAYPOINT_SET)
  popBackTaskWaypoint() {}

  @packet(CommandCode.CMD_TASK_CLEAR_WAYPOINT_SET)
  clearTaskWaypoints() {}

  @packet(CommandCode.CMD_TASK_EXECUTE_WAYPOINT_SET)
  executeTaskWaypoints() {}

  // Get/Set some global robot variables
  @packet(CommandCode.CMD_SET_DEFAULT_TCP, 'doubles' /* 6 * 8 */)
  setDefaultTcp(tcp) {}

  @packet(CommandCode.CMD_RESET_DEFAULT_TCP)
  resetDefaultTcp() {}

  @packet(CommandCode.CMD_SET_COMP_TCP, 'doubles' /* 6 * 8 */)
  setTcpCompensation(tcp) {}

  @packet(CommandCode.CMD_RESET_COMP_TCP)
  resetTcpCompensation() {}

  @packet(CommandCode.CMD_SET_REFFRAME, 'doubles' /* 6 * 8 */)
  setRefFrame(ref) {}

  @packet(CommandCode.CMD_RESET_REFFRAME)
  resetRefFrame() {}

  @packet(CommandCode.CMD_SET_COLLISION_LEVEL, 'int')
  setCollisionLevel(level) {}

  @packet(CommandCode.CMD_SET_JOINT_BOUNDARY, 'int')
  setJointSpeedLevel(level) {}

  @packet(CommandCode.CMD_SET_TASK_BOUNDARY, 'int')
  setTaskSpeedLevel(level) {}

  @packet(CommandCode.CMD_SET_JOINT_WTIME, 'double')
  setJointWaypointTime(time) {}

  @packet(CommandCode.CMD_SET_TASK_WTIME, 'double')
  setTaskWaypointTime(time) {}

  @packet(CommandCode.CMD_SET_TASK_CMODE, 'int')
  setTaskBaseMode(mode /* TaskBaseMode */) {}

  @packet(CommandCode.CMD_SET_JOINT_BLEND_RADIUS, 'double')
  setJointBlendRadius(radius) {}

  @packet(CommandCode.CMD_SET_TASK_BLEND_RADIUS, 'double')
  setTaskBlendRadius(radius) {}

  @packet(CommandCode.CMD_GET_DEFAULT_TCP, null, 'double')
  getDefaultTcp() {}

  @packet(CommandCode.CMD_GET_COMP_TCP, null, 'double')
  getTcpCompensation() {}

  @packet(CommandCode.CMD_GET_REFFRAME, null, 'double')
  getRefFrame() {}

  @packet(CommandCode.CMD_GET_COLLISION_LEVEL, null, 'int')
  getCollisionLevel() {}

  @packet(CommandCode.CMD_GET_JOINT_BOUNDARY, null, 'int')
  getJointSpeedLevel() {}

  @packet(CommandCode.CMD_GET_TASK_BOUNDARY, null, 'int')
  getTaskSpeedLevel() {}

  @packet(CommandCode.CMD_GET_JOINT_WTIME, null, 'double')
  getJointWaypointTime() {}

  @packet(CommandCode.CMD_GET_TASK_WTIME, null, 'double')
  getTaskWaypointTime() {}

  @packet(CommandCode.CMD_GET_TASK_CMODE, null, 'int')
  getTaskBaseMode() {}

  @packet(CommandCode.CMD_GET_JOINT_BLEND_RADIUS, null, 'double')
  getJointBlendRadius() {}

  @packet(CommandCode.CMD_GET_TASK_BLEND_RADIUS, null, 'double')
  getTaskBlendRadius() {}

  @packet(CommandCode.CMD_GET_RUNNING_TIME, null, 'double')
  getRobotRunningTime() {}

  @packet(CommandCode.CMD_GET_CMODE, null, 'int')
  getCmode() {}

  @packet(CommandCode.CMD_GET_JOINT_STATE, null, 'bools')
  getServoState() {
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
  getJointPos() {}

  @packet(CommandCode.CMD_GET_JOINT_VELOCITY, null, 'doubles')
  getJointVel() {}

  @packet(CommandCode.CMD_GET_TASK_POSITION, null, 'doubles')
  getTaskPos() {}

  @packet(CommandCode.CMD_GET_TASK_VELOCITY, null, 'doubles')
  getTaskVel() {}

  @packet(CommandCode.CMD_GET_TORQUE, null, 'doubles')
  getTorque() {}

  @packet(CommandCode.CMD_GET_LAST_EMG_INFO)
  getLastEmergencyInfo() {
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
  getSmartDI(idx) {}

  @packet(CommandCode.CMD_GET_SMART_DIS, null, 'bools')
  getSmartDIs() {}

  @packet(CommandCode.CMD_SET_SMART_DO, ['int', 'bool'])
  setSmartDO(idx, val) {}

  @packet(CommandCode.CMD_SET_SMART_DOS, 'bools' /* 32 */)
  setSmartDOs(idx) {}

  @packet(CommandCode.CMD_GET_SMART_AI, 'int', 'int')
  getSmartAI(idx) {}

  @packet(CommandCode.CMD_SET_SMART_AO, ['int', 'int'])
  setSmartAO(idx, val) {}

  @packet(CommandCode.CMD_GET_SMART_DO, 'int', 'bool')
  getSmartDO(idx) {}

  @packet(CommandCode.CMD_GET_SMART_DOS, null, 'bools')
  getSmartDOs() {}

  @packet(CommandCode.CMD_GET_SMART_AO, 'int', 'int')
  getSmartAO(idx) {}

  @packet(CommandCode.CMD_SET_ENDTOOL_DO, ['int', 'bool'])
  setEndtoolDO(endtool_type /* EndToolType */, val) {}

  @packet(CommandCode.CMD_GET_ENDTOOL_DO, 'int', 'bool')
  getEndtoolDO(type /* EndToolType */) {}

  // FT sensor implementation
  @packet(CommandCode.CMD_GET_EXTIO_FTCAN_ROBOT_RAW, null, 'ints')
  getRobotFtSensorRaw() {}

  @packet(CommandCode.CMD_GET_EXTIO_FTCAN_ROBOT_TRANS, null, 'doubles')
  getRobotFtSensorProcess() {}

  @packet(CommandCode.CMD_GET_EXTIO_FTCAN_CB_RAW, null, 'int')
  getCbFtSensorRaw() {}

  @packet(CommandCode.CMD_GET_EXTIO_FTCAN_CB_TRANS, null, 'double')
  getCbFtSensorProcess() {}

  @packet(CommandCode.CMD_READ_DIRECT_VARIABLE, ['int', 'int'], 'buffer')
  async readDirectVariable(dvType, dvAddr) {
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
  readDirectVariables(dvType, dvAddr, dvLen) {
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
  writeDirectVariable(dvType, dvAddr, val) {
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
  writeDirectVariables(dvType, dvAddr, dvLen, val) {
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
  setReducedMode(mode) {}

  @packet(CommandCode.CMD_SET_REDUCED_SPEED_RATIO, 'double')
  setReducedSpeedRatio(ratio) {}

  @packet(CommandCode.CMD_GET_REDUCED_MODE, null, 'bool')
  getReducedMode() {}

  @packet(CommandCode.CMD_GET_REDUCED_SPEED_RATIO, null, 'double')
  getReducedSpeedRatio() {}

  /* Extended IndyDCP command (Check all) */

  @extpacket(CommandCode.EXT_CMD_MOVE_TRAJ_BY_DATA)
  moveExtTrajBin(trajType, trajFreq, datSize, trajData, datNum = 3) {
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
  moveExtTrajTxt(trajType, trajFreq, datSize, trajData, datNum = 3) {
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
  moveExtTrajBinFile(filename) {
    return {
      serializer() {
        return Buffer.from(filename + '\0')
      }
    }
  }

  @extpacket(CommandCode.EXT_CMD_MOVE_TRAJ_BY_TXT_FILE)
  moveExtTrajTxtFile(filename) {
    return {
      serializer() {
        return Buffer.from(filename + '\0')
      }
    }
  }

  jointMoveToWpSet() {}

  taskMoveToWpSet() {}

  /* JSON programming added (only for internal engineer) */
  setJsonProgram() {}

  @extpacket(CommandCode.EXT_CMD_SET_JSON_PROG_START, 'string')
  setAndStartJsonProgram(jsonString) {
    return {
      serializer() {
        return Buffer.from(jsonString + '\0')
      }
    }
  }

  waitForProgramFinish() {
    //     while this.isProgramRunning():
    //         pass
    //     console.log('Program Finished: ', GLOBAL_DICT['stop'])
    //     return GLOBAL_DICT['stop']
  }

  setWorkspace(commandPos) {
    //     if np.all(commandPos != 0):
    //         return true
    //     else:
    //         return false
  }

  /* Teaching points */
  loadTeachingData(filename) {
    //     with open(filename, "r") as jsonFile:
    //         teachConfig = json.load(jsonFile)
    //         return teachConfig
  }

  updateTeachingData(filename, wpName, jPos) {
    //     newPos = []
    //     for pos in jPos:
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

  delTeachingData(filename, wpName) {
    //     with open(filename) as jsonFile:
    //         teachConfig = json.load(jsonFile)
    //         del teachConfig[wpName]
    //     with open(filename, 'w') as f:
    //         json.dump(teachConfig, f)
    //     return teachConfig
  }
}
