import { expect } from 'chai'
import AwaitLock from 'await-lock'

import { mutex } from '../../src/decorators'
import { sleep } from '../../src/utils'

describe('Decorator', function () {
  describe('#mutex()', function () {
    class SimpleClazz {
      public lock
      public lockcount = 0
      public releasecount = 0
      public executed = false

      constructor() {
        this.lock = {
          acquireAsync: async () => {
            this.lockcount++
          },
          release: () => {
            this.releasecount++
          }
        }
      }

      @mutex
      decorated() {
        this.executed = true
        return this.releasecount
      }
    }

    it('지정된 메쏘드의 전후에서 lock-release 쌍이 실행되어야 한다.', async function () {
      var decorated = new SimpleClazz()

      var releasecount = await decorated.decorated()

      expect(decorated.executed).to.be.true
      expect(decorated.lockcount).to.equal(1)
      expect(decorated.lockcount).to.equal(1)
      expect(releasecount).to.equal(0)
    })

    class DecoratedClazz {
      public lock = new AwaitLock()
      public count = 0

      @mutex
      async decorated1() {
        for (let i = 0; i < 100; i++) {
          await sleep(1)
          this.count++
        }
        return this.count
      }

      @mutex
      async decorated2() {
        for (let i = 0; i < 100; i++) {
          await sleep(1)
          this.count--
        }
        return this.count
      }
    }

    it('지정된 메쏘드는 동시에 실행되지 않아야 한다.', async function () {
      // TODO 동시 실행 여부를 검증하도록 테스트 코드를 구현해야 한다.
      var decorated = new DecoratedClazz()

      var ret1 = await decorated.decorated1()
      var ret2 = await decorated.decorated2()

      expect(ret1).to.equal(100)
      expect(ret2).to.equal(0)
    })
  })
})
