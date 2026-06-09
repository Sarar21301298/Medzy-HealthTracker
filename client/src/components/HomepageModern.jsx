import React, { useState } from 'react';
import { 
  Search, Heart, Shield, Users, MessageCircle, Phone, Mail, MapPin, Clock, 
  Star, ArrowRight, Menu, X, AlertTriangle, Pill, TrendingUp, Zap,
  CheckCircle2, Truck, BarChart3, FileText, Eye, Lock
} from 'lucide-react';
import AIDoctorChatbot from './AIDoctorChatbot';
import DarkModeToggle from './DarkModeToggle';
import ReviewsSlider from './ReviewsSlider';
import { useDarkMode } from '../context/DarkModeContext';

const HomepageModern = ({ onGetStarted, onSignIn, user, onGoToDashboard, isGuest = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isDarkMode } = useDarkMode();

  // Key features for medicine platform
  const features = [
    {
      icon: <Search className="h-8 w-8" />,
      title: "Quick Medicine Search",
      description: "Find medicines with our smart search. View prices, availability, and alternatives instantly."
    },
    {
      icon: <Truck className="h-8 w-8" />,
      title: "Fast Delivery",
      description: "Track your medicine orders in real-time with guaranteed doorstep delivery within hours."
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Price Comparison",
      description: "Compare prices across pharmacies and get the best deals on your medications."
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: "Availability Tracking",
      description: "Check real-time stock availability and find the nearest pharmacy with your medicine."
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: "Prescription Verification",
      description: "Upload and verify prescriptions securely with our integrated verification system."
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "24/7 Operations",
      description: "Order medicines anytime. Our platform and AI support run round-the-clock for your health."
    },
  ];

  // Service categories
  const serviceCategories = [
    {
      title: "General Medicines",
      icon: <Pill className="h-6 w-6" />,
      description: "Common OTC and prescription medications"
    },
    {
      title: "Health Supplements",
      icon: <TrendingUp className="h-6 w-6" />,
      description: "Vitamins, supplements, and wellness products"
    },
    {
      title: "Chronic Care",
      icon: <Heart className="h-6 w-6" />,
      description: "Medications for long-term health management"
    },
    {
      title: "Emergency Supplies",
      icon: <AlertTriangle className="h-6 w-6" />,
      description: "Quick access to urgent medical needs"
    },
  ];

  const testimonials = [
    {
      name: "Dr. Rashid Ahmed",
      role: "Medical Professional",
      content: "The prescription verification system is seamless and secure. My patients love how easy it is to order medicines.",
      rating: 5
    },
    {
      name: "Karim's Pharmacy",
      role: "Pharmacy Owner",
      content: "MedZy connected us with thousands of customers. Our sales increased by 250% in just 3 months!",
      rating: 5
    },
    {
      name: "Fatima Khan",
      role: "Regular Customer",
      content: "I order my regular medicines through MedZy. Fast delivery, best prices, and excellent service!",
      rating: 5
    }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Navigation */}
      <nav className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-soft sticky top-0 z-50 border-b transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              title="MedZy - Back to Top"
            >
              <div className="bg-healthcare-green-600 p-2 rounded-lg transform hover:scale-110 transition-transform">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text-healthcare hidden sm:inline">MedZy</span>
            </button>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`${isDarkMode ? 'text-gray-300 hover:text-healthcare-green-400' : 'text-gray-600 hover:text-healthcare-green-600'} transition-colors font-medium`}>Features</a>
              <a href="#services" className={`${isDarkMode ? 'text-gray-300 hover:text-healthcare-green-400' : 'text-gray-600 hover:text-healthcare-green-600'} transition-colors font-medium`}>Services</a>
              <a href="#reviews" className={`${isDarkMode ? 'text-gray-300 hover:text-healthcare-green-400' : 'text-gray-600 hover:text-healthcare-green-600'} transition-colors font-medium`}>Reviews</a>
              <a href="#contact" className={`${isDarkMode ? 'text-gray-300 hover:text-healthcare-green-400' : 'text-gray-600 hover:text-healthcare-green-600'} transition-colors font-medium`}>Contact</a>
              
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Welcome, {user.firstName}!</span>
                  <button
                    onClick={onGoToDashboard}
                    className="btn-healthcare btn-healthcare-primary"
                  >
                    Dashboard
                  </button>
                  <DarkModeToggle />
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={onSignIn}
                    className="btn-healthcare btn-healthcare-secondary"
                  >
                    Sign In
                  </button>
                  <DarkModeToggle />
                </div>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <DarkModeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className={`md:hidden pb-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex flex-col space-y-3 pt-4">
                <a href="#features" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} hover:text-healthcare-green-600 transition-colors`}>Features</a>
                <a href="#services" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} hover:text-healthcare-green-600 transition-colors`}>Services</a>
                <a href="#reviews" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} hover:text-healthcare-green-600 transition-colors`}>Reviews</a>
                <a href="#contact" className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} hover:text-healthcare-green-600 transition-colors`}>Contact</a>
                {user ? (
                  <button onClick={onGoToDashboard} className="w-full btn-healthcare btn-healthcare-primary">
                    Dashboard
                  </button>
                ) : (
                  <button onClick={onGetStarted} className="w-full btn-healthcare btn-healthcare-primary">
                    Get Started
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Medicine Search Focused */}
      <section className={`py-16 md:py-28 ${isDarkMode ? 'bg-gradient-to-b from-gray-800 to-gray-900' : 'bg-gradient-light'} transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Hero Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-healthcare-green-100 dark:bg-healthcare-green-900/20 p-4 rounded-3xl">
                <Zap className="h-12 w-12 text-healthcare-green-600 dark:text-healthcare-green-400" />
              </div>
            </div>

            {/* Main Headline */}
            <h1 className={`text-5xl md:text-6xl font-bold mb-6 leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              We bring the pharmacy to your 
              <span className="gradient-text-healthcare"> doorstep</span>
            </h1>

            {/* Subheadline */}
            <p className={`text-xl md:text-2xl mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
              Find medicines, compare prices, and track your order in real-time. All in one place.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <div className="relative flex-1 max-w-md mx-auto sm:mx-0">
                <input
                  type="text"
                  placeholder="Search for medicines, supplements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-healthcare w-full"
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <button className="btn-healthcare btn-healthcare-primary whitespace-nowrap">
                Search
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <button
                    onClick={onGoToDashboard}
                    className="btn-healthcare btn-healthcare-primary group"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="h-5 w-5 inline-block ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="btn-healthcare btn-healthcare-outline"
                  >
                    Explore Features
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onGetStarted}
                    className="btn-healthcare btn-healthcare-primary group"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="h-5 w-5 inline-block ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="btn-healthcare btn-healthcare-outline"
                  >
                    Learn More
                  </button>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className={`flex flex-wrap justify-center gap-6 mt-12 pt-8 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} text-sm`}>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-healthcare-green-600" />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>10,000+ Medicines</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-healthcare-green-600" />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>500+ Pharmacies</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-healthcare-green-600" />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>2-hour Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className={`py-20 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="section-divider mx-auto mb-6"></div>
            <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Why Choose MedZy?
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Everything you need for convenient, affordable medicine shopping
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`card-healthcare p-8 hover:shadow-soft-lg hover:-translate-y-1 transform transition-all duration-300 group`}
              >
                <div className={`p-3 w-fit rounded-xl mb-4 ${isDarkMode ? 'bg-healthcare-green-900/20' : 'bg-healthcare-green-100'} text-healthcare-green-600 dark:text-healthcare-green-400 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section id="services" className={`py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="section-divider mx-auto mb-6"></div>
            <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Our Services
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Comprehensive medicine and health solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceCategories.map((service, index) => (
              <div
                key={index}
                className={`card-healthcare p-8 text-center hover:scale-105 transform transition-all duration-300 cursor-pointer group`}
              >
                <div className={`p-4 w-fit mx-auto rounded-2xl mb-4 ${isDarkMode ? 'bg-healthcare-green-900/20' : 'bg-healthcare-green-100'} text-healthcare-green-600 dark:text-healthcare-green-400 group-hover:scale-125 transition-transform`}>
                  {service.icon}
                </div>
                <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {service.title}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-healthcare-green-600 dark:bg-healthcare-green-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-4xl md:text-5xl font-bold mb-2">10,000+</div>
              <div className="text-green-100">Medicines Available</div>
            </div>
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
              <div className="text-green-100">Partner Pharmacies</div>
            </div>
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-4xl md:text-5xl font-bold mb-2">98%</div>
              <div className="text-green-100">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className={`py-20 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="section-divider mx-auto mb-6"></div>
            <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Loved by Healthcare Professionals & Patients
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              See what our users have to say
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`card-healthcare p-8 hover:shadow-soft-lg transition-all duration-300`}>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-6 italic`}>
                  "{testimonial.content}"
                </p>
                <div>
                  <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {testimonial.name}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Doctor Showcase */}
      <section className={`py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className={`inline-flex items-center ${isDarkMode ? 'bg-healthcare-green-900/30' : 'bg-healthcare-green-100'} text-healthcare-green-700 dark:text-healthcare-green-300 px-4 py-2 rounded-full text-sm font-medium mb-6`}>
                <MessageCircle className="h-4 w-4 mr-2" />
                AI Health Assistant
              </div>
              
              <h2 className={`text-4xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Your Personal Health Companion
              </h2>
              
              <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Get instant medical guidance powered by advanced AI. Describe your symptoms and receive professional health recommendations 24/7, completely free.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-healthcare-green-600 dark:text-healthcare-green-400 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Instant Symptom Analysis</h3>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Get AI-powered insights on your symptoms</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-healthcare-green-600 dark:text-healthcare-green-400 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Secure & Private</h3>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Your health data is encrypted and protected</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-healthcare-green-600 dark:text-healthcare-green-400 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Available 24/7</h3>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Medical guidance anytime, anywhere free</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className={`card-healthcare p-8 border-2 border-healthcare-green-200 dark:border-healthcare-green-700`}>
                <div className={`text-center mb-6 p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-2xl`}>
                  <MessageCircle className="h-12 w-12 text-healthcare-green-600 mx-auto mb-4" />
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Try MedZy AI Now</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>Click chat to start your health consultation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className={`py-20 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="section-divider mx-auto mb-6"></div>
            <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Get In Touch
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              We're here to help with any questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Phone className="h-8 w-8" />, title: "Phone", info: "+1 (555) 123-4567", detail: "Sun-Thu 9AM-6PM (GMT+6)" },
              { icon: <Mail className="h-8 w-8" />, title: "Email", info: "support@medzy.health", detail: "24-hour response time" },
              { icon: <MapPin className="h-8 w-8" />, title: "Office", info: "Gulshan Healthcare Ave", detail: "Dhaka, Bangladesh 1212" }
            ].map((contact, index) => (
              <div key={index} className={`card-healthcare p-8 text-center hover:scale-105 transform transition-all duration-300`}>
                <div className={`p-4 w-fit mx-auto rounded-2xl mb-4 ${isDarkMode ? 'bg-healthcare-green-900/20' : 'bg-healthcare-green-100'} text-healthcare-green-600 dark:text-healthcare-green-400`}>
                  {contact.icon}
                </div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  {contact.title}
                </h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>
                  {contact.info}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {contact.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${isDarkMode ? 'bg-gray-950' : 'bg-gray-900'} text-white py-12 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity"
                title="Back to Top"
              >
                <div className="bg-healthcare-green-600 p-2 rounded-lg">
                  <Pill className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">MedZy</h3>
              </button>
              <p className="text-gray-400">
                Your trusted platform for convenient medicine shopping and healthcare management.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className={`border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-700'} pt-8 text-center text-gray-400`}>
            <p>&copy; 2025 MedZy Healthcare Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* AI Doctor Chatbot */}
      <AIDoctorChatbot />
    </div>
  );
};

export default HomepageModern;

