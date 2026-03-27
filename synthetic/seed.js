import dotenv from 'dotenv'
dotenv.config({ path: new URL('.env.synthetic', import.meta.url).pathname })
import admin from 'firebase-admin'
import { scrypt, randomBytes, randomUUID } from 'node:crypto'

let TEST_USERS
try {
  const mod = await import('./users.js')
  TEST_USERS = mod.TEST_USERS
} catch (_) {
  console.error('ERROR: synthetic/users.js not found. Copy users.example.js and fill credentials.')
  process.exit(1)
}

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString('hex')
    scrypt(password, salt, 64, (err, dk) => {
      if (err) reject(err)
      else resolve(`${salt}:${dk.toString('hex')}`)
    })
  })
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
})
const db = admin.firestore()

async function main() {
  for (const { email, password } of TEST_USERS) {
    const hashedPassword = await hashPassword(password)
    const fields = {
      email,
      password: hashedPassword,
      plan: 'pro',
      planStatus: 'ACTIVE',
      planStartedAt: new Date(),
      planExpiresAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscribedAt: null,
      canceledAt: null,
      trial: {
        durationDays: 3,
        startedAt: new Date(),
      },
      limits: {
        maxActiveSeries: 20,
        activeSeriesCount: 0,
        monthlyActionsMax: 100,
        monthlyActionsRemaining: 100,
        monthlyActionsResetAt: null,
      },
    }

    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get()
    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      await doc.ref.update(fields)
      console.log(JSON.stringify({ email, userId: doc.id, action: 'updated' }))
    } else {
      const userId = randomUUID()
      await db.collection('users').doc(userId).set(fields)
      console.log(JSON.stringify({ email, userId, action: 'created' }))
    }
  }
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
