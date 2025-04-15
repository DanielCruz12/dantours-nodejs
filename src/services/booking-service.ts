import { eq } from 'drizzle-orm'
import { db } from '../database/db'
import { Bookings } from '../database/schemas/bookings'
import { statusCodes } from '../utils'
import { Products, TourDates, Users } from '../database/schemas'
import moment from 'moment'
import "moment/locale/es";

// 🔍 Obtener todas las reservas
export const getBookingsService = async () => {
  try {
    const bookings = await db.select().from(Bookings)
    return bookings
  } catch (error) {
    console.error('500:', statusCodes[500], '-', error)
    throw new Error('Error al obtener las reservas.')
  }
}

export const getBookingByIdService = async (bookingId: string) => {
  if (!bookingId) {
    console.error('400:', 'El ID de la reserva es obligatorio.')
    throw new Error('El ID de la reserva es obligatorio.')
  }

  try {
    const [bookingData] = await db
      .select({
        bookingId: Bookings.id,
        tickets: Bookings.tickets,
        total: Bookings.total,
        productId: Bookings.product_id,
        userFirstName: Users.first_name,
        userLastName: Users.last_name,
        productName: Products.name,
        tourDate: TourDates.date,
      })
      .from(Bookings)
      .leftJoin(Users, eq(Bookings.user_id, Users.id))
      .leftJoin(Products, eq(Bookings.product_id, Products.id))
      .leftJoin(TourDates, eq(Bookings.tour_date_id, TourDates.id))
      .where(eq(Bookings.id, bookingId))
      .limit(1)

    if (!bookingData) return null

    return {
      nombre: `${bookingData.userFirstName} ${bookingData.userLastName}`,
      producto: bookingData.productName,
      tickets: bookingData.tickets,
      total: bookingData.total,
      fechaSeleccionada: moment(bookingData.tourDate).format('LLLL'),
    }
  } catch (error) {
    console.error('500:', 'Error al obtener la reserva extendida:', error)
    throw new Error('Error al obtener la reserva extendida.')
  }
}

// 🔍 Obtener todas las reservas de un usuario
export const getBookingsForUserService = async (userId: string) => {
  if (!userId) {
    console.error('400:', statusCodes[400])
    throw new Error('El ID del usuario es obligatorio.')
  }

  try {
    const bookings = await db
      .select()
      .from(Bookings)
      .where(eq(Bookings.user_id, userId))
      .execute()

    if (!bookings || bookings.length === 0) {
      console.log('El usuario no tiene reservas.')
    }

    return bookings
  } catch (error) {
    console.error('500:', statusCodes[500], '-', error)
    throw new Error('Error al obtener las reservas del usuario.')
  }
}

export const getBookingsByProductIdService = async (productId: string) => {
  if (!productId) {
    console.error('400:', statusCodes[400])
    throw new Error('El ID del producto es obligatorio.')
  }

  try {
    const bookings = await db
      .select()
      .from(Bookings)
      .where(eq(Bookings.product_id, productId))
      .execute()

    return bookings
  } catch (error) {
    console.error('500:', statusCodes[500], '-', error)
    throw new Error('Error al obtener las reservas del producto.')
  }
}

// ➕ Crear nueva reserva
export const createBookingService = async (bookingData: any) => {
  const requiredFields = [
    'user_id',
    'product_id',
    'paymentMethod',
    'idTransaccion',
  ]

  const missingFields = requiredFields.filter((field) => !bookingData[field])

  if (missingFields.length > 0) {
    console.error(
      '400:',
      statusCodes[400],
      '-',
      `Faltan campos: ${missingFields.join(', ')}`,
    )
    throw new Error(`Los campos ${missingFields.join(', ')} son obligatorios.`)
  }

  try {
    const [newBooking] = await db
      .insert(Bookings)
      .values({
        ...bookingData,
      })
      .returning()

    return newBooking
  } catch (error) {
    console.error('500:', statusCodes[500], '-', error)
    throw new Error('Error al crear la reserva.')
  }
}

// 🔄 Actualizar reserva
export const updateBookingService = async (
  bookingId: string,
  bookingData: any,
) => {
  if (!bookingId) {
    console.error('400:', statusCodes[400])
    throw new Error('El ID de la reserva es obligatorio.')
  }

  try {
    const [updatedBooking] = await db
      .update(Bookings)
      .set(bookingData)
      .where(eq(Bookings.id, bookingId))
      .returning()

    if (!updatedBooking) {
      console.error('404:', statusCodes[404])
      throw new Error('Reserva no encontrada para actualizar.')
    }

    return updatedBooking
  } catch (error) {
    console.error('500:', statusCodes[500], '-', error)
    throw new Error('Error al actualizar la reserva.')
  }
}

export const updateBookingStatusByTransactionId = async (
  transactionId: string,
  newStatus: 'completed' | 'in-process' | 'canceled',
) => {
  if (!transactionId) {
    console.error('400:', statusCodes[400])
    throw new Error('El ID de la transacción es obligatorio.')
  }

  try {
    const [updatedBooking] = await db
      .update(Bookings)
      .set({ status: newStatus })
      .where(eq(Bookings.idTransaccion, transactionId))
      .returning()

    if (!updatedBooking) {
      console.warn('⚠️ Transacción recibida pero no hay booking asociado.')
    }

    return updatedBooking
  } catch (error) {
    console.error('500:', statusCodes[500], '-', error)
    throw new Error('Error al actualizar el estado del booking.')
  }
}

// ❌ Eliminar una reserva
export const deleteBookingService = async (bookingId: string) => {
  if (!bookingId) {
    console.error('400:', statusCodes[400])
    throw new Error('El ID de la reserva es obligatorio.')
  }

  try {
    const [deletedBooking] = await db
      .delete(Bookings)
      .where(eq(Bookings.id, bookingId))
      .returning()

    if (!deletedBooking) {
      console.error('404:', statusCodes[404])
      throw new Error('Reserva no encontrada para eliminar.')
    }

    return deletedBooking
  } catch (error) {
    console.error('500:', statusCodes[500], '-', error)
    throw new Error('Error al eliminar la reserva.')
  }
}
