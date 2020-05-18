import { expect } from 'chai'
import { ROBOT_IP, ROBOT_NAME } from '../settings'
import { IndyDCPClient } from '../../src/dcp-client'
import { sleep } from '../../src/utils'

describe('IndyDCPClient', function () {
  describe('#getJointPos()', function () {
    this.timeout(10000)

    it('should return binary string', async () => {
      var client = new IndyDCPClient(ROBOT_IP, ROBOT_NAME)
      await client.connect()

      var jointPositions = await client.getJointPos()
      console.log('Joint Positions: ', jointPositions)

      var taskPositions = await client.getTaskPos()
      console.log('Task Position: ', taskPositions)

      var jointVelocities = await client.getJointVel()
      var taskVelocities = await client.getTaskVel()
      var torques = await client.getTorque()

      console.log('Joint Velocities', jointVelocities)
      console.log('Task Velocities', taskVelocities)
      console.log('Torques', torques)

      client.disconnect()
    })
  })
})
