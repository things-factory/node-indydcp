import { expect } from 'chai'
import { ROBOT_INDY7 } from '../../src/const'
import { CommandCode } from '../../src/command-code'
import { buildReqPacket, buildExtReqPacket, parseResPacket, parsePacketHeader } from '../../src/packet'

describe('Packet', function () {
  describe('#parsepacketHeader', function () {
    it('헤더정보를 디코딩했을 때 동일 정보를 유지해야한다.', async function () {
      var client = {
        robotName: ROBOT_INDY7,
        robotVersion: '',
        stepInfo: 0x02,
        sofClient: 0x34,
        invokeId: 0
      }

      var { buffer } = buildReqPacket(client as any, CommandCode.CMD_CHECK)

      console.log(buffer)

      var convertedHeader = parsePacketHeader(buffer)

      expect(convertedHeader.robotName).to.be.equal(ROBOT_INDY7)
      expect(convertedHeader.robotVersion).to.be.equal('')
      expect(convertedHeader.stepInfo).to.be.equal(0x02)
      expect(convertedHeader.sof).to.be.equal(0x34)
      expect(convertedHeader.invokeId).to.be.equal(1)
    })
  })

  describe('#buildReqPacket', function () {
    it('헤더정보에 클라이언트의 정보를 반영해야한다.', async function () {
      var client = {
        robotName: ROBOT_INDY7,
        robotVersion: '',
        stepInfo: 0x02,
        sofClient: 0x34,
        invokeId: 0
      }

      var { header, buffer } = buildReqPacket(client as any, CommandCode.CMD_CHECK)

      console.log(buffer)

      expect(header.robotName).to.be.equal(ROBOT_INDY7)
      expect(header.robotVersion).to.be.equal('')
      expect(header.stepInfo).to.be.equal(0x02)
      expect(header.sof).to.be.equal(0x34)
      expect(header.invokeId).to.be.equal(1)
      expect(header.cmdId).to.be.equal(CommandCode.CMD_CHECK)

      /* parse as a response */
      var { header: resHeader, data: resData } = parseResPacket(buffer)

      console.log('res data', resData)
      expect(resHeader.robotName).to.be.equal(ROBOT_INDY7)
      expect(resHeader.robotVersion).to.be.equal('')
      expect(resHeader.stepInfo).to.be.equal(0x02)
      expect(resHeader.sof).to.be.equal(0x34)
      expect(resHeader.invokeId).to.be.equal(1)
      expect(resHeader.cmdId).to.be.equal(CommandCode.CMD_CHECK)
    })

    it('헤더정보에 클라이언트의 정보를 반영해야한다.', async function () {
      var client = {
        robotName: ROBOT_INDY7,
        robotVersion: '',
        stepInfo: 0x02,
        sofClient: 0x34,
        invokeId: 0,
        JOINT_DOF: 6
      }

      CommandCode.CMD_SET_BRAKE, 'bool6dArr', this.JOINT_DOF * 1
      var buffer = Buffer.alloc(client.JOINT_DOF * 1)
      buffer.writeInt8(1, 0)
      buffer.writeInt8(0, 1)
      buffer.writeInt8(1, 2)
      buffer.writeInt8(0, 3)
      buffer.writeInt8(1, 4)
      buffer.writeInt8(0, 5)

      var { header, buffer } = buildReqPacket(client as any, CommandCode.CMD_SET_BRAKE, buffer)

      expect(header.robotName).to.be.equal(ROBOT_INDY7)
      expect(header.robotVersion).to.be.equal('')
      expect(header.stepInfo).to.be.equal(0x02)
      expect(header.sof).to.be.equal(0x34)
      expect(header.invokeId).to.be.equal(1)
      expect(header.cmdId).to.be.equal(CommandCode.CMD_SET_BRAKE)

      /* parse as a response */
      var { header: resHeader, data: resData } = parseResPacket(buffer)

      expect(resHeader.robotName).to.be.equal(ROBOT_INDY7)
      expect(resHeader.robotVersion).to.be.equal('')
      expect(resHeader.stepInfo).to.be.equal(0x02)
      expect(resHeader.sof).to.be.equal(0x34)
      expect(resHeader.invokeId).to.be.equal(1)
      expect(resHeader.cmdId).to.be.equal(CommandCode.CMD_SET_BRAKE)

      expect(resData.readInt8(0)).to.be.equal(1)
      expect(resData.readInt8(1)).to.be.equal(0)
      expect(resData.readInt8(2)).to.be.equal(1)
      expect(resData.readInt8(3)).to.be.equal(0)
      expect(resData.readInt8(4)).to.be.equal(1)
      expect(resData.readInt8(5)).to.be.equal(0)
    })
  })

  describe('#buildExtReqPacket', function () {
    it('헤더정보에 클라이언트의 정보와 메시지의 데이타를 반영해야한다.', async function () {
      var client = {
        robotName: ROBOT_INDY7,
        robotVersion: '',
        stepInfo: 0x02,
        sofClient: 0x34,
        invokeId: 0
      }
      var data = Buffer.alloc(8).fill(0x01)

      var { header, buffer } = buildExtReqPacket(client as any, CommandCode.EXT_CMD_MOVE_TRAJ_BY_DATA, data)

      console.log(buffer)

      expect(header.robotName).to.be.equal(ROBOT_INDY7)
      expect(header.robotVersion).to.be.equal('')
      expect(header.stepInfo).to.be.equal(0x02)
      expect(header.sof).to.be.equal(0x34)
      expect(header.invokeId).to.be.equal(1)

      var { header: resHeader, ext: extHeader, data: resData } = parseResPacket(buffer)

      expect(resHeader.robotName).to.be.equal(ROBOT_INDY7)
      expect(resHeader.robotVersion).to.be.equal('')
      expect(resHeader.stepInfo).to.be.equal(0x02)
      expect(resHeader.sof).to.be.equal(0x34)
      expect(resHeader.invokeId).to.be.equal(1)
      expect(resHeader.cmdId).to.be.equal(CommandCode.CMD_FOR_EXTENDED)

      expect(extHeader.cmdId).to.be.equal(CommandCode.EXT_CMD_MOVE_TRAJ_BY_DATA)
      expect(extHeader.dataSize).to.be.equal(8)

      expect(resData.length).to.be.equal(8)
      expect(resData.readInt8(0)).to.be.equal(1)
      expect(resData.readInt8(1)).to.be.equal(1)
      expect(resData.readInt8(2)).to.be.equal(1)
      expect(resData.readInt8(3)).to.be.equal(1)
      expect(resData.readInt8(4)).to.be.equal(1)
      expect(resData.readInt8(5)).to.be.equal(1)
      expect(resData.readInt8(6)).to.be.equal(1)
      expect(resData.readInt8(7)).to.be.equal(1)
    })
  })
})
