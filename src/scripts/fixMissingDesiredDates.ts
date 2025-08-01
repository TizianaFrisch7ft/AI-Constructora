import mongoose from "mongoose"
import dotenv from "dotenv"
import QuoteRequestLine from "../models/QuoteRequestLine" // Ajustá la ruta si es distinta

dotenv.config()

const MONGO_URI = process.env.MONGO_URI!

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    console.log("✅ Conectado a MongoDB")

    const lines = await QuoteRequestLine.find({ desired_date: { $exists: false } })
    console.log(`🔍 Encontradas ${lines.length} líneas sin desired_date`)

    const fechaDefault = new Date("2024-12-01")

    for (const line of lines) {
      line.desired_date = fechaDefault
      await line.save()
      console.log(`✅ Actualizada línea ${line._id}`)
    }

    console.log("🎉 Finalizado con éxito")
    process.exit(0)
  } catch (err) {
    console.error("❌ Error:", err)
    process.exit(1)
  }
}

run()
