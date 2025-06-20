export const runtime = 'edge'

import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma = new PrismaClient().$extends(withAccelerate())

export async function GET() {
  const users = await prisma.user.findMany()
  return Response.json(users)
}
