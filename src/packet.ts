import Struct from 'struct'
import { ErrorCode, getErrorString } from './error-code'
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
  .word8Sbe('stepInfo')
  .word8Sbe('sof')
  .word32Sbe('invokeId')
  .word32Sbe('dataSize')
  .word32Sbe('status')
  .chars('reserved', 6)
  .word32Sbe('command')

export const ExtHeader = Struct() // need to be packed
  .word32Sbe('dataSize')
  .word32Sbe('command')

export const DIO = Struct() // DIO struct
  .word32Sle('channel')
  .chars('value', 1)

/* packets */
export function parsePacketHeader(buffer) {
  HeaderCommand._setBuff(buffer)
  return HeaderCommand.fields
}

export function parseExtHeader(buffer) {
  ExtHeader._setBuff(buffer)
  return ExtHeader.fields
}

export function parseResPacket(buffer) {
  var header = parsePacketHeader(buffer)
  var data = buffer.slice(SIZE_HEADER_COMMAND)

  if (header.command == CommandCode.CMD_FOR_EXTENDED) {
    var ext = parseExtHeader(data.slice(0, 8))
    var data = data.slice(8)
  }

  return {
    header,
    ext,
    data
  }
}

// data type
export const DTYPES = {
  char: 1,
  bool: 1,
  int: 4,
  float: 4,
  double: 8
}

export const DTRANSFORM = {
  char: 'UInt8',
  bool: 'UInt8',
  int: 'Int32BE',
  float: 'FloatBE',
  double: 'DoubleBE'
}

// packet util functions
export function buildReqPacket(
  client: IIndyDCPClient,
  command: number,
  reqData?: any,
  reqDataSize?: number
): { header: any; buffer: Buffer } {
  var header = HeaderCommand.allocate().fields
  var buffer = HeaderCommand.buffer()

  reqDataSize = reqDataSize || reqData?.length || 0

  header.robotName = client.robotName
  header.robotVersion = client.robotVersion
  header.stepInfo = client.stepInfo
  header.sof = client.sofClient
  header.command = command
  header.dataSize = reqDataSize

  header.invokeId = ++client.invokeId

  if (reqDataSize > 0) {
    return {
      header,
      buffer: Buffer.concat([buffer, reqData], buffer.length + reqDataSize)
    }
  }

  return {
    header,
    buffer
  }
}

export function buildExtReqPacket(
  client: IIndyDCPClient,
  extCommand: number,
  reqExtData?: any,
  reqExtDataSize?: number
): any {
  var ext = ExtHeader.allocate().fields
  var extBuffer = ExtHeader.buffer()

  reqExtDataSize = reqExtDataSize || reqExtData?.length || 0

  ext.command = extCommand
  ext.dataSize = reqExtDataSize

  var { header, buffer: packetBuffer } = buildReqPacket(client, CommandCode.CMD_FOR_EXTENDED, extBuffer)

  if (reqExtDataSize > 0) {
    return {
      header,
      buffer: Buffer.concat([packetBuffer, reqExtData], packetBuffer.length + reqExtDataSize)
    }
  }

  return {
    header,
    ext,
    buffer: packetBuffer
  }
}

export function checkHeader(reqHeader, resHeader, errorCode = ErrorCode.ERR_NONE) {
  const checklist = ['robotName', 'stepInfo', 'invokeId', 'sof', 'command']

  for (let prop in checklist) {
    if (reqHeader[prop] !== resHeader[prop]) {
      console.log('Header check fail (', prop, '): Request ', reqHeader[prop], ', Response ', resHeader[prop])
    }
  }

  if (resHeader.command == CommandCode.CMD_ERROR) {
    console.log(getErrorString(errorCode))
    return errorCode
  }

  return ErrorCode.ERR_NONE
}
