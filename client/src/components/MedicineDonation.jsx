import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';

const MedicineDonation = () => {
  const { getAuthHeaders } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'success' });
  const formRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // OCR state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedChips, setExtractedChips] = useState([]);

  // Photo upload state
  const [donationPhotos, setDonationPhotos] = useState([]);
  const photoInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    medicineName: '',
    genericName: '',
    brand: '',
    dosage: '',
    form: 'tablet',
    quantity: '',
    unit: 'pieces',
    expiryDate: '',
    manufacturingDate: '',
    batchNumber: '',
    manufacturer: '',
    description: '',
    reason: '',
    condition: 'excellent',
    unopened: true,
    donorContact: {
      phone: '',
      email: '',
      preferredContactMethod: 'both'
    },
    pickupLocation: {
      address: '',
      city: '',
      postalCode: '',
      additionalInfo: ''
    },
    availability: {
      availableDays: [],
      availableTime: {
        from: '09:00',
        to: '17:00'
      }
    }
  });

  const [errors, setErrors] = useState({});

  const medicineFormOptions = [
    'tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'other'
  ];

  const unitOptions = [
    'pieces', 'bottles', 'tubes', 'vials', 'boxes', 'strips'
  ];

  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        availableDays: prev.availability.availableDays.includes(day)
          ? prev.availability.availableDays.filter(d => d !== day)
          : [...prev.availability.availableDays, day]
      }
    }));
  };

  // OCR Handler Functions
  const handleImageSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setModalContent({
        title: 'Invalid File',
        message: 'Please select an image file.',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setModalContent({
        title: 'File Too Large',
        message: 'Please select an image smaller than 5MB.',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageSelect(files[0]);
    }
  };

  const handleImageDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processOCR = async () => {
    if (!selectedImage) {
      setModalContent({
        title: 'No Image',
        message: 'Please select an image first.',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    setIsProcessingOCR(true);
    setOcrProgress(0);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = await Tesseract.recognize(e.target.result, 'eng', {
            logger: (m) => {
              if (m.status === 'recognizing') {
                setOcrProgress(Math.round(m.progress * 100));
              }
            }
          });

          const extractedText = result.data.text;
          setOcrText(extractedText);

          // Split text into words and filter meaningful snippets
          const words = extractedText
            .split(/[\s\n]+/)
            .filter(word => word.length > 0)
            .map(word => word.replace(/[^\w-]/g, ''))
            .filter(word => word.length > 0);

          // Remove duplicates and create chips
          const uniqueWords = [...new Set(words)];
          setExtractedChips(
            uniqueWords.map((word, idx) => ({
              id: idx,
              text: word,
              used: false
            }))
          );

          setModalContent({
            title: 'OCR Successful',
            message: `Extracted ${uniqueWords.length} text items from the image. Click or drag them into the form fields.`,
            type: 'success'
          });
          setShowModal(true);
        } catch (error) {
          console.error('OCR Error:', error);
          setModalContent({
            title: 'OCR Failed',
            message: 'Failed to process image. Please try again.',
            type: 'error'
          });
          setShowModal(true);
        }
      };
      reader.readAsArrayBuffer(selectedImage);
    } catch (error) {
      console.error('Error reading file:', error);
      setModalContent({
        title: 'Error',
        message: 'Failed to read image file.',
        type: 'error'
      });
      setShowModal(true);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleChipClick = (chipText, fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: chipText
    }));

    // Mark chip as used
    setExtractedChips(prev =>
      prev.map(chip =>
        chip.text === chipText ? { ...chip, used: true } : chip
      )
    );
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setOcrText('');
    setExtractedChips([]);
    setOcrProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Photo upload handlers
  const handlePhotoSelect = (files) => {
    if (!files) return;

    const newPhotos = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        setModalContent({
          title: 'Invalid File',
          message: 'Please select image files only.',
          type: 'error'
        });
        setShowModal(true);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setModalContent({
          title: 'File Too Large',
          message: `${file.name} is larger than 5MB. Please select smaller images.`,
          type: 'error'
        });
        setShowModal(true);
        continue;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setDonationPhotos(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            file: file,
            preview: e.target.result,
            name: file.name
          }
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    handlePhotoSelect(files);
  };

  const handlePhotoDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removePhoto = (photoId) => {
    setDonationPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.medicineName.trim()) newErrors.medicineName = 'Medicine name is required';
    if (!formData.dosage.trim()) newErrors.dosage = 'Dosage is required';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    if (!formData.manufacturingDate) newErrors.manufacturingDate = 'Manufacturing date is required';
    if (!formData.reason.trim()) newErrors.reason = 'Reason for donation is required';
    if (!formData.donorContact.phone.trim()) newErrors['donorContact.phone'] = 'Phone number is required';
    if (!formData.donorContact.email.trim()) newErrors['donorContact.email'] = 'Email is required';
    if (!formData.pickupLocation.address.trim()) newErrors['pickupLocation.address'] = 'Address is required';
    if (!formData.pickupLocation.city.trim()) newErrors['pickupLocation.city'] = 'City is required';
    if (!formData.pickupLocation.postalCode.trim()) newErrors['pickupLocation.postalCode'] = 'Postal code is required';

    // Date validation
    const expiryDate = new Date(formData.expiryDate);
    const manufacturingDate = new Date(formData.manufacturingDate);
    const today = new Date();

    if (expiryDate <= today) {
      newErrors.expiryDate = 'Expiry date must be in the future';
    }

    if (manufacturingDate >= expiryDate) {
      newErrors.manufacturingDate = 'Manufacturing date must be before expiry date';
    }

    // Available days validation
    if (formData.availability.availableDays.length === 0) {
      newErrors.availableDays = 'Please select at least one available day';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.donorContact.email && !emailRegex.test(formData.donorContact.email)) {
      newErrors['donorContact.email'] = 'Please enter a valid email address';
    }

    // Photo validation - require at least 3 photos
    if (donationPhotos.length < 3) {
      newErrors.photos = `Please upload at least 3 photos (currently: ${donationPhotos.length}/3)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setModalContent({
        title: 'Validation Error',
        message: 'Please fix the errors in the form before submitting.',
        type: 'error'
      });
      setShowModal(true);
      return;
    }

    setIsLoading(true);

    try {
      // Upload photos first
      const photoUrls = [];
      console.log('📤 Starting to upload', donationPhotos.length, 'photos');
      
      for (const photo of donationPhotos) {
        const formDataWithPhoto = new FormData();
        formDataWithPhoto.append('photo', photo.file);

        const photoResponse = await fetch('/api/donations/upload-photo', {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeaders()['Authorization']
          },
          body: formDataWithPhoto
        });

        const photoData = await photoResponse.json();
        if (photoData.success) {
          console.log('✅ Photo uploaded:', photoData.data.url);
          photoUrls.push(photoData.data.url);
        } else {
          throw new Error(`Failed to upload photo: ${photo.name}`);
        }
      }

      // Submit donation with photo URLs
      const donationDataWithPhotos = {
        ...formData,
        photos: photoUrls.map(url => ({ url }))
      };

      console.log('🎁 Submitting donation with photos:', donationDataWithPhotos.photos);

      const response = await fetch('/api/donations/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(donationDataWithPhotos)
      });

      const data = await response.json();

      if (data.success) {
        setModalContent({
          title: 'Success!',
          message: 'Your donation has been submitted successfully! It will be reviewed by our admin team.',
          type: 'success'
        });
        setShowModal(true);
        
        // Reset form
        formRef.current?.reset();
        setFormData({
          medicineName: '',
          genericName: '',
          brand: '',
          dosage: '',
          form: 'tablet',
          quantity: '',
          unit: 'pieces',
          expiryDate: '',
          manufacturingDate: '',
          batchNumber: '',
          manufacturer: '',
          description: '',
          reason: '',
          condition: 'excellent',
          unopened: true,
          donorContact: {
            phone: '',
            email: '',
            preferredContactMethod: 'both'
          },
          pickupLocation: {
            address: '',
            city: '',
            postalCode: '',
            additionalInfo: ''
          },
          availability: {
            availableDays: [],
            availableTime: {
              from: '09:00',
              to: '17:00'
            }
          }
        });
        setErrors({});
        setDonationPhotos([]);
      } else {
        throw new Error(data.message || 'Failed to submit donation');
      }
    } catch (error) {
      console.error('Error submitting donation:', error);
      setModalContent({
        title: 'Error',
        message: error.message || 'Failed to submit donation. Please try again.',
        type: 'error'
      });
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Donate Medicine
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Help others by donating unused medicines. All donations are reviewed by our team before being made available.
        </p>
      </div>

      {/* OCR Section */}
      <div className="mb-8 w-full">
        {/* Image Upload Area */}
        <div className="w-full">
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Upload Medicine Packet Image (Optional)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload a clear photo of your medicine packet. Our OCR system will extract text to help you fill the form.
            </p>

            {!imagePreview ? (
              <div
                onDrop={handleImageDrop}
                onDragOver={handleImageDragOver}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-healthcare-green-500 hover:bg-green-50 dark:hover:bg-gray-600 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Drag and drop your image here, or click to select
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, WebP up to 5MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e.target.files?.[0])}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Medicine packet"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={handleClearImage}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!ocrText && (
                  <button
                    onClick={processOCR}
                    disabled={isProcessingOCR}
                    className="w-full bg-healthcare-green-500 hover:bg-healthcare-green-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    {isProcessingOCR ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin mr-2">⏳</span>
                        Processing ({ocrProgress}%)...
                      </span>
                    ) : (
                      '✨ Extract Text with OCR'
                    )}
                  </button>
                )}

                {ocrText && (
                  <div className="space-y-2">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <p className="text-sm text-green-700 dark:text-green-300 font-semibold flex items-center">
                        <Check className="w-4 h-4 mr-2" />
                        Text extracted successfully!
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Extracted Text - Review and Copy Relevant Information:
                      </label>
                      <textarea
                        value={ocrText}
                        readOnly
                        className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-sm font-mono overflow-y-auto"
                        placeholder="Extracted text will appear here..."
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(ocrText);
                          setModalContent({
                            title: 'Copied!',
                            message: 'All extracted text has been copied to clipboard.',
                            type: 'success'
                          });
                          setShowModal(true);
                        }}
                        className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                      >
                        📋 Copy All Text
                      </button>
                    </div>
                    <button
                      onClick={handleClearImage}
                      className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Upload Different Image
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Grid layout adjustment - now full width on desktop */}
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
        {/* Photo Upload Section */}
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload Medicine Photos (Minimum 3 Required) *
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload clear photos of your medicine packet from different angles. This helps recipients verify authenticity and condition.
          </p>

          {/* Photo Upload Area */}
          <div
            onDrop={handlePhotoDrop}
            onDragOver={handlePhotoDragOver}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-healthcare-green-500 hover:bg-green-50 dark:hover:bg-gray-600 transition mb-4"
            onClick={() => photoInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Drag and drop photos here, or click to select
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, WebP up to 5MB each. Upload multiple photos at once.
            </p>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handlePhotoSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Photo Counter */}
          <div className={`mb-4 p-3 rounded-lg ${donationPhotos.length >= 3 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'}`}>
            <p className={`text-sm font-semibold ${donationPhotos.length >= 3 ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
              {donationPhotos.length < 3 ? '⚠️' : '✅'} Photos uploaded: {donationPhotos.length}/3 required
            </p>
          </div>

          {/* Photo Previews */}
          {donationPhotos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {donationPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.preview}
                    alt={photo.name}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    title="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                    {photo.name}
                  </p>
                </div>
              ))}
            </div>
          )}

          {errors.photos && (
            <p className="text-red-500 text-sm mt-4 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {errors.photos}
            </p>
          )}
        </div>

        {/* Medicine Information */}
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Medicine Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Medicine Name *
              </label>
              <input
                type="text"
                name="medicineName"
                value={formData.medicineName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500 ${
                  errors.medicineName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter medicine name"
              />
              {errors.medicineName && (
                <p className="text-red-500 text-sm mt-1">{errors.medicineName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Generic Name
              </label>
              <input
                type="text"
                name="genericName"
                value={formData.genericName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                placeholder="Enter generic name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                placeholder="Enter brand name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dosage *
              </label>
              <input
                type="text"
                name="dosage"
                value={formData.dosage}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500 ${
                  errors.dosage ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 500mg, 10ml"
              />
              {errors.dosage && (
                <p className="text-red-500 text-sm mt-1">{errors.dosage}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Form *
              </label>
              <select
                name="form"
                value={formData.form}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
              >
                {medicineFormOptions.map(form => (
                  <option key={form} value={form}>
                    {form.charAt(0).toUpperCase() + form.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity *
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500 ${
                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter quantity"
                />
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                >
                  {unitOptions.map(unit => (
                    <option key={unit} value={unit}>
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Manufacturing Date *
              </label>
              <input
                type="date"
                name="manufacturingDate"
                value={formData.manufacturingDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500 ${
                  errors.manufacturingDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.manufacturingDate && (
                <p className="text-red-500 text-sm mt-1">{errors.manufacturingDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expiry Date *
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500 ${
                  errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.expiryDate && (
                <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Batch Number
              </label>
              <input
                type="text"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                placeholder="Enter batch number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Manufacturer
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                placeholder="Enter manufacturer name"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Medicine Condition *
            </label>
            <div className="flex space-x-4">
              {['excellent', 'good', 'fair'].map(condition => (
                <label key={condition} className="flex items-center">
                  <input
                    type="radio"
                    name="condition"
                    value={condition}
                    checked={formData.condition === condition}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300 capitalize">
                    {condition}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="unopened"
                checked={formData.unopened}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Medicine is unopened/sealed
              </span>
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
              placeholder="Additional information about the medicine"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Donation *
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              rows="2"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500 ${
                errors.reason ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Why are you donating this medicine?"
            />
            {errors.reason && (
              <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Contact Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="donorContact.phone"
                value={formData.donorContact.phone}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500 ${
                  errors['donorContact.phone'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter phone number"
              />
              {errors['donorContact.phone'] && (
                <p className="text-red-500 text-sm mt-1">{errors['donorContact.phone']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="donorContact.email"
                value={formData.donorContact.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500 ${
                  errors['donorContact.email'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {errors['donorContact.email'] && (
                <p className="text-red-500 text-sm mt-1">{errors['donorContact.email']}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Contact Method
            </label>
            <select
              name="donorContact.preferredContactMethod"
              value={formData.donorContact.preferredContactMethod}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
            >
              <option value="both">Both Phone & Email</option>
              <option value="phone">Phone Only</option>
              <option value="email">Email Only</option>
            </select>
          </div>
        </div>

        {/* Pickup Location */}
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Pickup Location
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address *
              </label>
              <textarea
                name="pickupLocation.address"
                value={formData.pickupLocation.address}
                onChange={handleInputChange}
                rows="2"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500 ${
                  errors['pickupLocation.address'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter full address"
              />
              {errors['pickupLocation.address'] && (
                <p className="text-red-500 text-sm mt-1">{errors['pickupLocation.address']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City *
              </label>
              <input
                type="text"
                name="pickupLocation.city"
                value={formData.pickupLocation.city}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500 ${
                  errors['pickupLocation.city'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter city"
              />
              {errors['pickupLocation.city'] && (
                <p className="text-red-500 text-sm mt-1">{errors['pickupLocation.city']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Postal Code *
              </label>
              <input
                type="text"
                name="pickupLocation.postalCode"
                value={formData.pickupLocation.postalCode}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500 ${
                  errors['pickupLocation.postalCode'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter postal code"
              />
              {errors['pickupLocation.postalCode'] && (
                <p className="text-red-500 text-sm mt-1">{errors['pickupLocation.postalCode']}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Information
              </label>
              <textarea
                name="pickupLocation.additionalInfo"
                value={formData.pickupLocation.additionalInfo}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                placeholder="Landmarks, special instructions, etc."
              />
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Availability for Pickup
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Available Days *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {daysOfWeek.map(day => (
                <label key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.availability.availableDays.includes(day)}
                    onChange={() => handleDayToggle(day)}
                    className="mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300 capitalize">
                    {day.slice(0, 3)}
                  </span>
                </label>
              ))}
            </div>
            {errors.availableDays && (
              <p className="text-red-500 text-sm mt-1">{errors.availableDays}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Available From
              </label>
              <input
                type="time"
                name="availability.availableTime.from"
                value={formData.availability.availableTime.from}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Available To
              </label>
              <input
                type="time"
                name="availability.availableTime.to"
                value={formData.availability.availableTime.to}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to reset the form? All data will be lost.')) {
                formRef.current?.reset();
                setFormData({
                  medicineName: '',
                  genericName: '',
                  brand: '',
                  dosage: '',
                  form: 'tablet',
                  quantity: '',
                  unit: 'pieces',
                  expiryDate: '',
                  manufacturingDate: '',
                  batchNumber: '',
                  manufacturer: '',
                  description: '',
                  reason: '',
                  condition: 'excellent',
                  unopened: true,
                  donorContact: {
                    phone: '',
                    email: '',
                    preferredContactMethod: 'both'
                  },
                  pickupLocation: {
                    address: '',
                    city: '',
                    postalCode: '',
                    additionalInfo: ''
                  },
                  availability: {
                    availableDays: [],
                    availableTime: {
                      from: '09:00',
                      to: '17:00'
                    }
                  }
                });
                setErrors({});
              }
            }}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Reset Form
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-healthcare-green-600 text-white rounded-lg hover:bg-healthcare-green-700 focus:outline-none focus:ring-2 focus:ring-healthcare-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Submitting...' : 'Submit Donation'}
          </button>
        </div>
      </form>

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalContent.title}
          type={modalContent.type}
        >
          <p className="text-gray-600 dark:text-gray-300">
            {modalContent.message}
          </p>
        </Modal>
      )}
    </div>
  );
};

export default MedicineDonation;
