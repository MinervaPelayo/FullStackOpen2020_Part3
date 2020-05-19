require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
const Contact = require('./models/contact')

morgan.token('body', (req) => {
  return JSON.stringify(req.body)
})

app.use(express.static('build'))
app.use(cors())
app.use(express.json())
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :body')
)

app.get('/', (req, res) => {
  res.send('<h1>This is my backend!</h1>')
})

app.get('/info', (req, res, next) => {
  Contact.find({})
    .then((persons) => {
      const personsnumber = persons.length
      const date = new Date()
      res.send(
        `<p>Phonebook has info for ${personsnumber} people</p><p>${date}</p>`
      )
    })
    .catch((error) => next(error))
})

app.get('/api/persons', (req, res, next) => {
  Contact.find({})
    .then((persons) => {
      res.json(persons)
    })
    .catch((error) => next(error))
})

app.get('/api/persons/:id', (req, res, next) => {
  Contact.findById(req.params.id)
    .then((person) => {
      if (person) {
        res.json(person)
      } else {
        res.status(404).end()
      }
    })
    .catch((error) => next(error))
})

app.post('/api/persons', (req, res, next) => {
  const body = req.body

  if (body.name === '' || body.number === '') {
    return res.status(400).json({
      error: 'name or number missing',
    })
  }

  const person = new Contact({
    name: body.name,
    number: body.number,
  })

  person
    .save()
    .then((savedPerson) => {
      res.json(savedPerson)
    })
    .catch((error) => next(error))
})

app.put('/api/persons/:id', (req, res, next) => {
  const body = req.body

  if (body.number === '') {
    return res.status(400).json({
      error: 'number missing',
    })
  }

  const person = {
    name: body.name,
    number: body.number,
  }

  Contact.findByIdAndUpdate(
    req.params.id,
    person,
    { new: true, runValidators: true, context: 'query' },
    (err, updatedPerson) => {
      if (err) {
        return next(err)
      }
      res.json(updatedPerson)
    }
  )
})

app.delete('/api/persons/:id', (req, res, next) => {
  Contact.findByIdAndRemove(req.params.id)
    .then(() => {
      res.status(204).end()
    })
    .catch((error) => next(error))
})

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
