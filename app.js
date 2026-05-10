import express from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import { errors as celebrateErrors } from 'celebrate'
import announcementsRouter from './src/routes/announcement.routes.js'

const app = express()

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Announcements REST API',
      version: '1.0.0',
      description:
        'REST API для дошки оголошень. Підтримує пошук, сортування, пагінацію та повний CRUD-набір операцій.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

app.use(express.json())

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/announcements', announcementsRouter)

app.use(celebrateErrors())

// 404 Not Found handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err)

  // JSON parsing errors (invalid JSON format)
  if (err.type === 'entity.parse.failed' && err.status === 400) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid JSON',
      validation: {
        body: {
          source: 'body',
          keys: [],
          message: 'Invalid JSON format in request body',
        },
      },
    })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Resource not found' })
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Unique constraint violation' })
  }

  if (err.code === 'P2003') {
    return res.status(400).json({ error: 'Foreign key constraint failed' })
  }

  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`API docs: http://localhost:${PORT}/api-docs`)
})
