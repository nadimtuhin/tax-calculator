export const contactInfo = {
  email: 'nadimtuhin@gmail.com',
  phone: '+880 176 304 9077',
  businessHours: {
    days: 'Sunday - Thursday',
    time: '9:00 AM - 5:00 PM',
    timezone: 'Bangladesh Standard Time (GMT+6)'
  }
}

export const formFields = {
  name: {
    label: 'Full Name',
    placeholder: 'Mamunur Rashid',
    type: 'text',
    required: true
  },
  email: {
    label: 'Email Address',
    placeholder: 'mamun@gmail.com',
    type: 'email',
    required: true
  },
  phone: {
    label: 'Phone Number',
    placeholder: '+880 176 304 9077',
    type: 'tel',
    required: false
  },
  message: {
    label: 'Your Message',
    placeholder: 'I need help with saving tax',
    type: 'textarea',
    required: true
  }
}
