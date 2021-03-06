const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const checkToken = require('./helpers/checkToken');
const sendgrid = require('@sendgrid/mail');
sendgrid.setApiKey(process.env.SENDGRID_APIKEY);
const passwordgenerator = require('generate-password');

let User = require('../../models/user.model');


const signIn = (res, user) => {
  jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '10h' },
    (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          baseCurrency: user.baseCurrency,
          language: user.language,
        }
      });
    })
};

router.post('/', (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  if(!email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  // Check for existing user
  User.findOne({ email })
    .then(user => {
      if (!user) return res.status(400).json({ message: 'User Does not exist' });

      // Validate password
      bcrypt.compare(password, user.password)
        .then(isMatch => {
          if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
          signIn(res, user);
        })
        .catch(err => res.status(400).json(`Error while getting user : ${err}`));
    })
});

router.get('/all', checkToken, (req, res) => {
  User.find()
    .then(users => res.json(users))
    .catch(err => res.status(400).json(`Error: ${err}`));
});


router.get('/:id', (req, res) => {
  User.findById(req.params.id)
    .then(user => res.json(user))
    .catch(() => res.status(404).json('no user with this id'));
});

router.post('/add', (req, res) => {
  console.log('req.body.baseCurrency : ', req.body.baseCurrency);
  const {
    name,
    email,
    password,
    baseCurrency,
    registerDate,
    language,
  } = req.body;

  if(!name || !email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  User.findOne({
    email
  }).then(user => {
    if (user) {
      return res.status(400).json({ message: 'Email already exists' });
    } else {
      const newUser = new User({
        name,
        email,
        password,
        baseCurrency,
        registerDate,
        language,
      });

      bcrypt.genSalt(10, (err, salt) => {
        if (err) console.error('There was an error during salt', err);
        else {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) console.error('There was an error during hash', err);
            else {
              newUser.password = hash;
              newUser
                .save()
                .then(user => {
                  signIn(res, user);
                })
                .catch(err => res.status(400).json({message: `Error while saving new user: ${err}`}));
            }
          });
        }
      });
    }
  })

});

router.delete('/:id', (req, res) => {
  User.findById(req.params.id)
    .then(
      user => user.remove().then(
        () => res.json({ success: true })
      )
    )
    .catch(() => res.status(404).json({ success: false }));
});

router.put('/:id', (req, res) => {
  User.findById(req.params.id)
    .then(user => {
      user.language = req.body.lang;

      user.save()
        .then(() => res.json('User updated'))
        .catch(err => res.status(400).json(`Error: ${err}`));
    });
});

router.post('/resetpassword', (req, res) => {
  const { email, subject, changedPassword } = req.body;

  const newPassword = changedPassword || passwordgenerator.generate({
    length: 10,
    numbers: true,
  });

  const msg = {
    to: email,
    from: 'hxf.finance@protonmail.com',
    subject,
    text: `your new password is: ${newPassword}`,
  };

  User.findOne({ email })
    .then(user => {
      user.password = newPassword;
      bcrypt.genSalt(10, (err, salt) => {
        if (err) console.error('There was an error during salt', err);
        else {
          bcrypt.hash(newPassword, salt, (err, hash) => {
            if (err) console.error('There was an error during hash', err);
            else {
              user.password = hash;
              user.save()
                .then(() => {
                  console.log('user updated');
                  sendgrid.send(msg)
                    .then(() => res.json('sendgrid success'))
                    .catch(err => res.status(400).json('sendgrid error : ', err))
                })
                .catch(err => { console.log('error :', err) });
            }
          });
        }
      });
    })
    .catch(() => {
      res.status(400).json('no users registered with this email');
    });
});

module.exports = router;
