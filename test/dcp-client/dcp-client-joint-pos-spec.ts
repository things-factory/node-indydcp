import { expect } from 'chai'
import { IndyDCPClient } from '../../src/dcp-client'
import { sleep } from '../../src/utils'

describe('IndyDCPClient', function () {
  describe('#get_joint_pos()', function () {
    it('should return binary string', async () => {
      var client = new IndyDCPClient('192.168.1.207', 'NRMK-Indy7')
      await client.connect()

      var jointPositions = await client.get_joint_pos()
      console.log('Joint Positions: ', jointPositions)

      var taskPositions = await client.get_task_pos()
      console.log('Task Position: ', taskPositions)

      var jointVelocities = await client.get_joint_vel()
      var taskVelocities = await client.get_task_vel()
      var torques = await client.get_torque()

      console.log('Joint Velocities', jointVelocities)
      console.log('Task Velocities', taskVelocities)
      console.log('Torques', torques)

      client.disconnect()
    })
  })
})
