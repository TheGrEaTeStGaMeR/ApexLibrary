const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const Book = require('./models/book');
const fs = require('fs');
const path = require('path');
const flash = require('express-flash');
const { ensureAuthenticated } = require('./middleware/authMiddleware');

const app = express();
const port = 3000;

mongoose.connect('mongodb+srv://priyanshu:20112003@apexlibrary.q28vcxe.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

// Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(methodOverride('_method'));
app.use(session({
    secret: '123',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Passport configuration
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return done(null, false, { message: 'Incorrect email or password.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return done(null, false, { message: 'Incorrect email or password.' });
        }
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Initialize Passport and Passport session
app.use(passport.initialize());
app.use(passport.session());

// Middleware to pass currentUser to all routes
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
  });

// Routes

// Home route
app.get('/', async (req, res) => {
    try {
        const books = await Book.find();
        res.render('landing', { books, currentUser: req.user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login route
app.get('/login', (req, res) => {
    res.render('login');
});

//Handle login form submission
app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

// Register route
app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user) {
            req.flash('error', 'Email already registered. Please log in.');
            return res.redirect('/register');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ email, username, password: hashedPassword });
        res.redirect('/login');
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.get('/books', async (req, res) => {
    try {
        const books = await Book.find();
        res.render('books/index', { books, currentUser: req.user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


app.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) {
            console.error('Error logging out:', err);
        }
        res.redirect('/');
    });
});

// CRUD Routes for Books
app.get('/books/new', ensureAuthenticated, (req, res) => {
    res.render('books/new', { currentUser: req.user });
});

app.post('/books', ensureAuthenticated, async (req, res) => {
    const { title, author, genre, isbn, publicationDate, description } = req.body;
    try {
        const newBook = await Book.create({ title, author, genre, isbn, publicationDate, description });
        res.redirect('/books');
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.get('/books/:id', ensureAuthenticated, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.render('books/show', { book, currentUser: req.user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


app.get('/books/:id/edit', ensureAuthenticated, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.render('books/edit', { book, currentUser: req.user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/books/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { title, author, genre, isbn, publicationDate, description } = req.body;
        const book = await Book.findByIdAndUpdate(
            req.params.id,
            { title, author, genre, isbn, publicationDate, description },
            { new: true }
        );
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.redirect(`/books/${book._id}`);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/books/:id', ensureAuthenticated, async (req, res) => {
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

async function seedDatabase() {
    try {
        const booksData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'books.json'), 'utf8'));

        const isbnsFromFile = booksData.map((book) => book.isbn);

        const existingBooks = await Book.find({ isbn: { $in: isbnsFromFile } });

        const existingIsbns = existingBooks.map((book) => book.isbn);

        const newBooksData = booksData.filter((book) => !existingIsbns.includes(book.isbn));

        // Insert new data from booksData
        if (newBooksData.length > 0) {
            await Book.insertMany(newBooksData);
            console.log('New sample book data inserted into the database.');
        }

        // Log the number of new and reinserted documents
        console.log(`New data count: ${newBooksData.length}`);
        console.log(`Reinserted data count: ${existingBooks.length - newBooksData.length}`);
    } catch (err) {
        console.error('Error seeding the database:', err);
    }
}

app.listen(port, async () => {
    await seedDatabase();
    console.log(`Server is running on port ${port}`);
});
