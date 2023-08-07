// routes/books.js
const express = require('express');
const router = express.Router();
const Book = require('../models/book');

// Route for displaying all books
router.get('/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.render('books/index', { books });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route for displaying a specific book
router.get('/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.render('books/show', { book });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route for displaying the new book form
router.get('/books/new', (req, res) => {
  res.render('books/new');
});

// Route for adding a new book to the database
router.post('/books', async (req, res) => {
  const { title, author, genre, isbn, publicationDate, description } = req.body;
  try {
    const newBook = await Book.create({ title, author, genre, isbn, publicationDate, description });
    res.redirect('/books');
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route for displaying the edit book form
router.get('/books/:id/edit', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.render('books/edit', { book });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route for updating a book in the database
router.put('/books/:id', async (req, res) => {
  try {
    const { title, author, genre, isbn, publicationDate, description } = req.body;
    const book = await Book.findByIdAndUpdate(req.params.id, { title, author, genre, isbn, publicationDate, description }, { new: true });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.redirect(`/books/${book._id}`);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route for deleting a book from the database
router.delete('/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.redirect('/books');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
