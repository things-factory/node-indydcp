import Struct from 'struct'
import { ErrorCode, err_to_string } from './error-code'
import { RobotStatus } from './robot-status'
import { CommandCode } from './command-code'
import { IIndyDCPClient } from './const'

/* Header Status Bit */
const HEADER_STATUS_BIT_TASK_RUNNING = 0x80000000
// 0b 1000 0000 0000 0000 0000 0000 0000 0000
const HEADER_STATUS_BIT_ROBOT_READY = 0x40000000
// 0b 0100 0000 0000 0000 0000 0000 0000 0000
const HEADER_STATUS_BIT_EMG_STOPPED = 0x20000000
// 0b 0010 0000 0000 0000 0000 0000 0000 0000
const HEADER_STATUS_BIT_COLLIDED = 0x10000000
// 0b 0001 0000 0000 0000 0000 0000 0000 0000
const HEADER_STATUS_BIT_ERR_STATE = 0x08000000
// 0b 0000 1000 0000 0000 0000 0000 0000 0000
const HEADER_STATUS_BIT_BUSY = 0x04000000
// 0b 0000 0100 0000 0000 0000 0000 0000 0000
const HEADER_STATUS_BIT_MOVE_FINISHED = 0x02000000
// 0b 0000 0010 0000 0000 0000 0000 0000 0000
const HEADER_STATUS_BIT_HOME = 0x01000000
// 0b 0000 0001 0000 0000 0000 0000 0000 0000
const HEADER_STATUS_BIT_ZERO = 0x00800000
// 0b 0000 0000 1000 0000 0000 0000 0000 0000
const HEADER_STATUS_BIT_IN_RESETTING = 0x00400000
// 0b 0000 0000 0100 0000 0000 0000 0000 0000

const HEADER_STATUS_BIT_DIRECT_TEACHING = 0x00000080
// 0b 0000 0000 0000 0000 0000 0000 1000 0000
const HEADER_STATUS_BIT_TEACHING = 0x00000040
// 0b 0000 0000 0000 0000 0000 0000 0100 0000
const HEADER_STATUS_BIT_PROGRAM_RUNNING = 0x00000020
// 0b 0000 0000 0000 0000 0000 0000 0010 0000
const HEADER_STATUS_BIT_PROGRAM_PAUSED = 0x00000010
// 0b 0000 0000 0000 0000 0000 0000 0001 0000
const HEADER_STATUS_BIT_CONTY_CONNECTED = 0x00000008
// 0b 0000 0000 0000 0000 0000 0000 0000 1000

/* Robot Interface */
export const SIZE_HEADER = 52
export const SIZE_COMMAND = 4
export const SIZE_HEADER_COMMAND = 56
export const SIZE_DATA_TCP_MAX = 200
export const SIZE_DATA_MAX = 200
export const SIZE_DATA_ASCII_MAX = 32
export const SIZE_PACKET = 256

/* C-type Data */
export const TOOMUCH = 10 * 1024 * 1024

export const HeaderCommand = Struct() // need to be packed
  .chars('robotName', 20)
  .chars('robotVersion', 12)
  .chars('stepInfo', 1)
  .chars('sof', 1)
  .word32Sle('invokeId')
  .word32Sle('dataSize')
  .word32Sle('status')
  .chars('reserved', 6)
  .word32Sle('cmdId')

// export const Data = Struct() // union
//   .chars('byte', SIZE_DATA_TCP_MAX)
//   .chars('asciiStr', SIZE_DATA_ASCII_MAX + 1)
//   .chars('str', 200)
//   .chars('charVal')
//   .chars('boolVal')
//   .word16Sle('shortVal')
//   .word32Sle('intVal')
//   .floatle('floatVal')
//   .double64('doubleVal')
//   .chars('byteVal')
//   .chars('wordVal', 2)
//   .chars('uwordVal', 2)
//   .chars('dwordVal', 4)
//   .chars('lwordVal', 8)
//   .chars('bool6dArr', 6)
//   .chars('bool7dArr', 7)
//   .chars('boolArr', 200)
//   .chars('char2dArr', 2)
//   .chars('char3dArr', 3)
//   .chars('char6dArr', 6)
//   .chars('char7dArr', 7)
//   .chars('charArr', 200)
//   .word32Sle('int2dArr', 2)
//   .word32Sle('int3dArr', 3)
//   .word32Sle('int6dArr', 6)
//   .word32Sle('int7dArr', 7)
//   .word32Sle('intArr', 50)
//   .floatle('float3dArr', 3)
//   .floatle('float6dArr', 6)
//   .floatle('float7dArr', 7)
//   .floatle('floatArr', 50)
//   .doublele('double3dArr', 3)
//   .doublele('double6dArr', 6)
//   .doublele('double7dArr', 7)
//   .doublele('doubleArr', 50)
//   .chars('byteArr', 200)
//   .chars('wordArr', 2 * 100)
//   .chars('uwordArr', 2 * 100)
//   .chars('dwordArr', 4 * 50)
//   .chars('lwordArr', 8 * 25)

// export const Packet = Struct() // header + body
//   .struct('header', HeaderCommand)
//   .struct('body', Data)

// export const DIO = Struct() // DIO struct
//   .word32Sle('channel')
//   .chars('value', 1)

/* packets */
export function parsePacketHeader(buffer) {
  HeaderCommand._setBuff(buffer.slice(0, SIZE_HEADER))
  return HeaderCommand.fields
}

export function buildReqPacket(cmd: number, req_data?: any, req_data_size?: number): { header: any; buffer: Buffer } {
  var header = HeaderCommand.allocate().fields

  header.robotName = this.robot_name
  header.robot_version = this.robot_version
  header.stepInfo = this.__step_ver
  header.sof = this.__sof_client
  header.cmdId = cmd
  header.dataSize = req_data_size

  header.invokeId = ++this.v_invokeId

  if (req_data_size > 0) {
    var headerBuffer = header.buffer()
    return {
      header,
      buffer: Buffer.concat([headerBuffer, req_data], headerBuffer.length + req_data_size)
    }
  }

  return {
    header,
    buffer: header.buffer()
  }
}

export function buildExtReqPacket(ext_cmd: number, req_ext_data: any, req_ext_data_size: number = 0): any {
  var dataBuffer = Buffer.alloc(8)

  dataBuffer.writeInt32BE(ext_cmd)
  dataBuffer.writeInt32BE(req_ext_data_size || 0)

  var { header, buffer: packetBuffer } = buildReqPacket(CommandCode.CMD_FOR_EXTENDED, dataBuffer, 8)

  if (req_ext_data_size > 0) {
    return {
      header,
      buffer: Buffer.concat([packetBuffer, req_ext_data], packetBuffer.length + req_ext_data_size)
    }
  }

  return {
    header,
    buffer: packetBuffer
  }
}

export function buildResPacket(buffer) {
  return {
    header: parsePacketHeader(buffer),
    data: buffer.slice(SIZE_HEADER)
  }
}

export function check_header(reqHeader, resHeader, err_code = ErrorCode.ERR_NONE) {
  const checklist = ['robotName', 'stepInfo', 'invokeId', 'sof', 'cmdId']

  for (let prop in checklist) {
    if (reqHeader[prop] !== resHeader[prop]) {
      console.log('Header check fail (', prop, '): Request ', reqHeader[prop], ', Response ', resHeader[prop])
    }
  }

  if (resHeader.cmdId == CommandCode.CMD_ERROR) {
    console.log(err_to_string(err_code))
    return err_code
  }

  return ErrorCode.ERR_NONE
}
