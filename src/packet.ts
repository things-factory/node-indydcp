import Struct from 'struct'
import { ErrorCode, err_to_string } from './error-code'
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
  .word32Sbe('cmdId')

export const ExtHeader = Struct() // need to be packed
  .word32Sbe('dataSize')
  .word32Sbe('cmdId')

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

  if (header.cmdId == CommandCode.CMD_FOR_EXTENDED) {
    var ext = parseExtHeader(data.slice(0, 8))
    var data = data.slice(8)
  }

  return {
    header,
    ext,
    data
  }
}

export function buildReqPacket(
  client: IIndyDCPClient,
  cmd: number,
  req_data?: any,
  req_data_size?: number
): { header: any; buffer: Buffer } {
  var header = HeaderCommand.allocate().fields
  var buffer = HeaderCommand.buffer()

  req_data_size = req_data_size || req_data?.length || 0

  header.robotName = client.robotName
  header.robotVersion = client.robotVersion
  header.stepInfo = client.stepInfo
  header.sof = client.sofClient
  header.cmdId = cmd
  header.dataSize = req_data_size

  header.invokeId = ++client.invokeId

  if (req_data_size > 0) {
    return {
      header,
      buffer: Buffer.concat([buffer, req_data], buffer.length + req_data_size)
    }
  }

  return {
    header,
    buffer
  }
}

export function buildExtReqPacket(
  client: IIndyDCPClient,
  ext_cmd: number,
  req_ext_data?: any,
  req_ext_data_size?: number
): any {
  var ext = ExtHeader.allocate().fields
  var extBuffer = ExtHeader.buffer()

  req_ext_data_size = req_ext_data_size || req_ext_data?.length || 0

  ext.cmdId = ext_cmd
  ext.dataSize = req_ext_data_size

  var { header, buffer: packetBuffer } = buildReqPacket(client, CommandCode.CMD_FOR_EXTENDED, extBuffer)

  if (req_ext_data_size > 0) {
    return {
      header,
      buffer: Buffer.concat([packetBuffer, req_ext_data], packetBuffer.length + req_ext_data_size)
    }
  }

  return {
    header,
    ext,
    buffer: packetBuffer
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
