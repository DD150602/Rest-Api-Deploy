const express = require('express')
// crypto para poder crear ids unicas
const crypto = require('node:crypto')
const movies = require('./movies.json')
const cors = require('cors')
const pc = require('picocolors')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const PORT = process.env.PORT ?? 1234

const app = express()
app.use(express.json())
// los cors funcionan exclusivamente de los navegadores
// es un recurso que permite que un recurso sea restringido en un apagina web
// para evitar que algun dominio esterno pueda accedera a el
// CORS (cros origin resource shering)
// siempre se arregla en la parte del backend
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:1234',
      'https://movies.com',
      'https://midu.dev'
    ]
    // el navegador no envia la cabecera de origin cuando se hace la peticion en el mismo origin
    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    if (!origin) {
      return callback(null, true)
    }

    return callback(new Error('not allowed by CORS'))
  }

}))
app.disable('x-powered-by')

// métodos normales: GET/HEAD/POST
// métodos complejos: PUT/PATCH/DELETE

// CORS PRE-Flight
// requiere
// OPTIONS

app.get('/movies', (req, res) => {
  // en la propiedad query hay un objeto donde ya estan tranformados todos los query-params en un objeto
  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(movie => movie.genre.some(
      g => g.toLocaleLowerCase() === genre.toLocaleLowerCase())
    )
    return res.json(filteredMovies)
  }
  res.json(movies)
})

// :id es un segmento dinamico, los parametros de la url
app.get('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)

  if (movie) return res.json(movie)

  res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (!result.success) {
    return res.status(400).json(JSON.parse({ error: result.error.message }))
  }

  // crea un uuid v4
  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }
  movies.push(newMovie)

  res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)
  if (!result.success) {
    return res.status(400).json(JSON.parse({ error: result.error.message }))
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

app.listen(PORT, () => {
  console.log(pc.green(`server listening on port http://localhost:${PORT}`))
})
