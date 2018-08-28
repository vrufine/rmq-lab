const amqp = require('amqplib/callback_api')

function fibonacci (n) {
  if (n === 0 || n === 1) {
    return n
  } else {
    return fibonacci(n - 1) + fibonacci(n - 2)
  }
}

amqp.connect('amqp://localhost', (err, conn) => {
  if (err) console.log(err)
  conn.createChannel((err, ch) => {
    if (err) console.log(err)
    const q = 'rpc_queue'
    ch.assertQueue(q, { durable: false })
    ch.prefetch(1)
    console.log(' = Aguardando requisições RPC')
    ch.consume(q, (msg) => {
      const n = parseInt(msg.content.toString())
      console.log(` = fibonacci(${n}) => replyTo: ${msg.properties.replyTo}`)
      const r = fibonacci(n)
      ch.sendToQueue(
        msg.properties.replyTo,
        Buffer.from(r.toString()),
        { correlationId: msg.properties.correlationId }
      )
      ch.ack(msg)
    })
  })
})
