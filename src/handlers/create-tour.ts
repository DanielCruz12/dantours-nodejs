import { db } from '../database/db'
import { ProductAmenitiesProducts, Tours } from '../database/schemas'

export const createTourHandler = async (data: any, productId: string) => {
  const {
    departure_point,
    available_dates,
    max_people,
    itinerary = [],
    highlight,
    included,
    duration,
    amenities = [],
  } = data

  // ✅ Validaciones
  if (
    !departure_point ||
    !available_dates ||
    !Array.isArray(available_dates) ||
    available_dates.length === 0 ||
    !max_people ||
    !highlight ||
    !included ||
    !duration
  ) {
    throw new Error('Faltan campos obligatorios para el producto tipo Tour.')
  }

  // ✅ Validar fechas
  const parsedDates = available_dates.map((date: string) => {
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) {
      throw new Error(`La fecha '${date}' no es válida.`)
    }
    return parsed
  })

  // ✅ Insertar en tabla tours
  await db.insert(Tours).values({
    product_id: productId,
    departure_point,
    available_dates: parsedDates,
    max_people,
    itinerary,
    highlight,
    included,
    duration,
  })

  // ✅ Insertar amenities relacionados
  if (!Array.isArray(amenities) || amenities.length === 0) {
    throw new Error('El campo amenities debe ser un array no vacío.')
  }

  const amenityRows = amenities.map((amenityId: string) => ({
    productId: productId,
    productAmenityId: amenityId,
  }))

  await db.insert(ProductAmenitiesProducts).values(amenityRows).execute()
}
