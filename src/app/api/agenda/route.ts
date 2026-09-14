export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getAgendaEventsAction } from '@/actions/agenda'

export async function GET() {
  try {
    const events = await getAgendaEventsAction()
    return NextResponse.json(
      { 
        success: true, 
        events, 
        timestamp: new Date().toISOString() 
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  } catch (error: unknown) {
    console.error('Error fetching live agenda events:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener agenda'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
