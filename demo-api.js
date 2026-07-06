import express from 'express'
const app = express()
app.use(express.json())

app.get('/users', (req, res) => {
  res.json([
    { id: 1, name: 'Aryan',email:'aryan@example.com'},
    { id: 2, name: 'Priya', email: 'priya@example.com' }
  ])
})

app.post('/users', (req, res) => {
  const { name, email } = req.body
  res.status(201).json({ id: 3, name, email })
})

app.listen(4000, () => console.log('Demo API running on http://localhost:4000'))