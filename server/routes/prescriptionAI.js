// Enhanced AI-powered prescription text parsing functions
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Validate API key is configured
if (!GEMINI_API_KEY) {
  console.warn('⚠️ WARNING: GEMINI_API_KEY is not configured in environment variables. AI prescription analysis will be skipped.');
}

// Main AI-powered prescription text parsing function using Gemini AI
export async function parsePrescriptionText(extractedText) {
  try {
    // Validate input
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text provided for prescription analysis');
    }

    console.log('🔍 Starting AI analysis of prescription text...');
    
    // First, try AI parsing with Gemini if API key is available
    let aiResult = null;
    
    if (GEMINI_API_KEY) {
      try {
        aiResult = await analyzePrescriptionWithAI(extractedText);
        
        // If AI parsing was successful and found medicines, return AI results
        if (aiResult && aiResult.medicines && aiResult.medicines.length > 0) {
          console.log('✅ AI successfully parsed prescription');
          return aiResult;
        }
      } catch (aiError) {
        console.warn('⚠️ AI parsing encountered error, will try regex fallback:', aiError.message);
      }
    } else {
      console.warn('⚠️ Gemini API key not configured, using regex-based extraction');
    }

    // Fallback to regex parsing
    console.log('📋 Using regex-based prescription parsing as fallback');
    return await parseWithRegex(extractedText);

  } catch (error) {
    console.error('❌ Error in prescription parsing:', error);
    // Final fallback
    return {
      medicines: [{
        name: 'Processing Error - Please verify manually',
        genericName: 'Please verify with doctor',
        dosage: 'Unable to extract',
        form: 'Not specified',
        frequency: 'Please consult doctor',
        duration: 'Please consult doctor',
        instructions: 'Consult with your healthcare provider for accurate information',
        route: 'As prescribed',
        confidence: 0.1
      }],
      doctorName: 'Not found',
      hospitalName: 'Not found',
      date: new Date().toLocaleDateString(),
      patientName: 'Not specified',
      confidence: 0.1,
      totalMedicines: 0,
      aiAnalysis: false,
      processingMethod: 'Error Recovery',
      error: error.message
    };
  }
}

// Enhanced AI analysis using Gemini API for prescription parsing
export async function analyzePrescriptionWithAI(extractedText) {
  try {
    // Check if API key is configured
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in environment variables.');
    }

    const prompt = `
You are an expert pharmacist and medical text analyst. Analyze this prescription text extracted from OCR and provide a comprehensive analysis.

PRESCRIPTION TEXT TO ANALYZE:
"${extractedText}"

Please extract and structure the following information in JSON format:

{
  "medicines": [
    {
      "name": "Accurate medicine name (corrected if needed)",
      "genericName": "Generic/scientific name if different",
      "dosage": "Strength with unit (e.g., 500mg, 10ml)",
      "form": "Form (tablet, capsule, syrup, injection, etc.)",
      "frequency": "How often to take (e.g., 'Twice daily', '3 times daily', 'Every 8 hours')",
      "duration": "How long to take (e.g., '7 days', '2 weeks', 'Until finished')",
      "instructions": "Special instructions (with food, on empty stomach, etc.)",
      "route": "Route of administration (oral, topical, etc.)",
      "confidence": 0.9
    }
  ],
  "prescriptionDetails": {
    "doctorName": "Doctor's name if found",
    "hospitalName": "Hospital/clinic name if found",
    "date": "Prescription date if found",
    "patientName": "Patient name if clearly mentioned"
  },
  "overallConfidence": 0.85,
  "notes": "Any additional observations or concerns",
  "totalMedicines": 2
}

IMPORTANT INSTRUCTIONS:
1. Correct obvious OCR errors in medicine names (e.g., "Paracetemol" → "Paracetamol")
2. Provide both brand and generic names when possible
3. Be very accurate with dosages and units
4. Extract timing information carefully (morning, evening, with meals, etc.)
5. If text is unclear, indicate lower confidence scores
6. Include any warnings or special instructions found
7. Only include medicines you're confident about - don't guess
8. If no medicines can be confidently identified, return empty medicines array
9. Pay attention to common medicine abbreviations (e.g., "PCM" = Paracetamol)
10. Look for prescription headers, patient info, and medical facility details

Return ONLY the JSON object, no additional text.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const statusCode = response.status;
      
      if (statusCode === 401 || statusCode === 403) {
        throw new Error('Gemini API authentication failed. Check your GEMINI_API_KEY.');
      } else if (statusCode === 429) {
        throw new Error('Gemini API rate limit exceeded. Please try again later.');
      } else if (statusCode === 400) {
        throw new Error(`Gemini API request error: ${errorData?.error?.message || 'Invalid request'}`);
      }
      throw new Error(`Gemini API error: ${statusCode}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Gemini AI');
    }

    // Clean and parse the JSON response
    const cleanedResponse = aiResponse.replace(/```json\n?|```\n?/g, '').trim();
    const parsedResult = JSON.parse(cleanedResponse);

    // Validate and format the AI response
    if (parsedResult && parsedResult.medicines) {
      return {
        medicines: parsedResult.medicines.map(med => ({
          name: med.name || 'Unknown Medicine',
          genericName: med.genericName || med.name,
          dosage: med.dosage || 'As prescribed',
          form: med.form || 'Not specified',
          frequency: med.frequency || 'As prescribed',
          duration: med.duration || 'As prescribed',
          instructions: med.instructions || 'Follow doctor\'s instructions',
          route: med.route || 'Oral',
          confidence: med.confidence || 0.7
        })),
        doctorName: parsedResult.prescriptionDetails?.doctorName || 'Not found',
        hospitalName: parsedResult.prescriptionDetails?.hospitalName || 'Not found',
        date: parsedResult.prescriptionDetails?.date || new Date().toLocaleDateString(),
        patientName: parsedResult.prescriptionDetails?.patientName || 'Not specified',
        confidence: parsedResult.overallConfidence || 0.7,
        totalMedicines: parsedResult.totalMedicines || parsedResult.medicines.length,
        notes: parsedResult.notes || '',
        aiAnalysis: true,
        processingMethod: 'Gemini AI Enhanced'
      };
    }

    throw new Error('Invalid AI response format');

  } catch (error) {
    console.error('❌ AI prescription analysis failed:', error);
    throw error;
  }
}

// Fallback regex-based parsing with enhanced patterns
export async function parseWithRegex(extractedText) {
  console.log('📋 Using enhanced regex-based prescription parsing...');
  
  const medicines = [];
  const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
  
  // Enhanced medicine name patterns with better coverage
  const medicinePatterns = [
    // Standard format with dosage: Medicine Name 500mg
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(\d+(?:\.\d+)?)\s*(mg|g|ml|mcg|%|unit|IU)/gi,
    // Medicine with slash dosage: Amoxicillin/Clavulanic Acid 500/125mg
    /([A-Z][a-z]+(?:\/[A-Z][a-z]+)?(?:\s+[A-Z][a-z]+)*)\s+(\d+(?:\/\d+)?(?:\.\d+)?)\s*(mg|g|ml|mcg|%|unit|IU)/gi,
    // With Rx prefix: Rx: Paracetamol 500mg
    /Rx[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(\d+(?:\.\d+)?)\s*(mg|g|ml|mcg|%|unit|IU)/gi,
    // Generic pattern: medicine dosage (more permissive)
    /([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+(?:\.\d+)?)\s*(mg|g|ml|mcg|%|unit|IU|tab|tablet|cap|capsule)/gi,
    // Number prefix: 1. Medicine Name (just name, no dosage)
    /\d+[\.\)]\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    // Bullet point: * or - Medicine Name
    /[\*\-]\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
  ];

  // Enhanced frequency patterns
  const frequencyPatterns = [
    { pattern: /(\d+)\s*(?:times?|x)\s*(?:daily|day|per\s+day)/gi, format: (m) => `${m[1]} times daily` },
    { pattern: /(?:once|1)\s*(?:daily|day|per\s+day)/gi, format: () => 'Once daily' },
    { pattern: /(?:twice|2)\s*(?:daily|day|per\s+day)/gi, format: () => 'Twice daily' },
    { pattern: /(?:thrice|3|tds)\s*(?:daily|day|per\s+day)/gi, format: () => 'Three times daily' },
    { pattern: /every\s+(\d+)\s*(?:hours?|hrs?)/gi, format: (m) => `Every ${m[1]} hours` },
    { pattern: /(\d+)\s*(?:tab|tablet|cap|capsule)s?\s*(?:daily|per\s+day)/gi, format: (m) => `${m[1]} tablets daily` },
    { pattern: /bd|b\.d|BID/gi, format: () => 'Twice daily' },
    { pattern: /od|o\.d|QD/gi, format: () => 'Once daily' },
    { pattern: /tid|t\.i\.d|TID/gi, format: () => 'Three times daily' },
    { pattern: /qid|q\.i\.d|QID/gi, format: () => 'Four times daily' }
  ];

  // Process each line to find medicines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    for (const pattern of medicinePatterns) {
      const matches = [...line.matchAll(pattern)];
      for (const match of matches) {
        let medicineName = match[1]?.trim();
        let dosage = match[2] ? `${match[2]}${match[3] ? ' ' + match[3] : ''}`.trim() : '';
        
        if (!dosage && match[1]) {
          // Look for dosage in the same line
          const dosageMatch = line.match(/\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?\s*(?:mg|g|ml|mcg|%|unit|IU|tab|tablet|cap|capsule)/i);
          if (dosageMatch) dosage = dosageMatch[0];
        }
        
        if (medicineName && medicineName.length > 1) {
          // Clean medicine name (remove special characters but keep hyphens and slashes)
          medicineName = medicineName.replace(/[^\w\s\-\/]/g, '').trim();
          
          // Look for additional info in nearby lines
          let frequency = 'As prescribed';
          let duration = 'As prescribed';
          let instructions = 'Follow doctor\'s instructions';
          
          // Check current and next 3 lines for additional info
          for (let j = i; j < Math.min(i + 4, lines.length); j++) {
            const checkLine = lines[j].toLowerCase();
            
            // Extract frequency
            for (const freqData of frequencyPatterns) {
              const freqMatch = checkLine.match(freqData.pattern);
              if (freqMatch) {
                frequency = freqData.format(freqMatch);
                break;
              }
            }
            
            // Extract duration
            const durMatch = checkLine.match(/(?:for\s+)?(\d+)\s*(day|week|month|year)s?(?:\s|$|\.)/);
            if (durMatch) {
              const plural = parseInt(durMatch[1]) > 1 ? 's' : '';
              duration = `${durMatch[1]} ${durMatch[2]}${plural}`;
            }
            
            // Extract special instructions
            if (checkLine.includes('food') || checkLine.includes('meal') || checkLine.includes('eat')) {
              if (checkLine.includes('before')) instructions = 'Take 30 minutes before meals';
              else if (checkLine.includes('after')) instructions = 'Take 30 minutes after meals';
              else if (checkLine.includes('with')) instructions = 'Take with food';
              else instructions = 'Take with or without food';
            }
            
            if (checkLine.includes('empty stomach') || checkLine.includes('fasting')) {
              instructions = 'Take on empty stomach';
            }
            
            if (checkLine.includes('night') || checkLine.includes('bedtime') || checkLine.includes('bed time')) {
              frequency = frequency === 'As prescribed' ? 'At bedtime' : frequency + ' (at bedtime)';
            }
          }

          medicines.push({
            name: medicineName,
            genericName: medicineName,
            dosage: dosage || 'As prescribed',
            form: dosage?.toLowerCase().includes('ml') ? 'Liquid' : 
                  dosage?.toLowerCase().includes('tab') ? 'Tablet' :
                  dosage?.toLowerCase().includes('cap') ? 'Capsule' :
                  dosage?.toLowerCase().includes('inj') ? 'Injection' :
                  dosage?.toLowerCase().includes('cream') ? 'Cream' :
                  dosage?.toLowerCase().includes('powder') ? 'Powder' : 'Not specified',
            frequency: frequency,
            duration: duration,
            instructions: instructions,
            route: 'Oral',
            confidence: 0.65
          });
        }
      }
    }
  }

  // Try to extract doctor and hospital information
  let doctorName = 'Not found';
  let hospitalName = 'Not found';
  let prescriptionDate = new Date().toLocaleDateString();

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Extract doctor name - improved patterns
    if (doctorName === 'Not found') {
      // Pattern 1: Dr. Name or Doctor Name
      let drMatch = line.match(/(?:dr\.?|doctor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
      if (drMatch) {
        doctorName = drMatch[1].trim();
      }
      
      // Pattern 2: Signature with "Signature" or "Signed"
      if (doctorName === 'Not found') {
        drMatch = line.match(/(?:signature|signed|sign)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
        if (drMatch) {
          doctorName = drMatch[1].trim();
        }
      }
      
      // Pattern 3: Name with credentials (MD, MBBS, etc.)
      if (doctorName === 'Not found') {
        drMatch = line.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,?\s*(?:MD|MBBS|BDS|DDS|RN|DNP|PA)/i);
        if (drMatch) {
          doctorName = drMatch[1].trim();
        }
      }
    }
    
    // Extract hospital/clinic name - improved patterns
    if (hospitalName === 'Not found') {
      // Pattern 1: Hospital or Clinic name
      if (lowerLine.includes('hospital')) {
        const hospMatch = line.match(/([^,]*hospital[^,]*)/i);
        if (hospMatch) hospitalName = hospMatch[1].trim();
      }
      
      if (hospitalName === 'Not found' && (lowerLine.includes('clinic') || lowerLine.includes('medical center'))) {
        const clinicMatch = line.match(/([^,]*(clinic|medical center)[^,]*)/i);
        if (clinicMatch) hospitalName = clinicMatch[1].trim();
      }
      
      if (hospitalName === 'Not found' && lowerLine.includes('center') && lowerLine.includes('health')) {
        const centerMatch = line.match(/([^,]*(?:health|medical).*center[^,]*)/i);
        if (centerMatch) hospitalName = centerMatch[1].trim();
      }
    }
    
    // Extract date - improved patterns
    const dateMatch = line.match(/(?:date|dated)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i) ||
                      line.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
    if (dateMatch) {
      prescriptionDate = dateMatch[1];
    }
  }

  // Remove duplicates
  const uniqueMedicines = medicines.filter((medicine, index, self) => 
    index === self.findIndex(m => m.name.toLowerCase() === medicine.name.toLowerCase())
  );

  return {
    medicines: uniqueMedicines.length > 0 ? uniqueMedicines : [{
      name: 'Unable to extract medicine names clearly',
      genericName: 'Please verify with doctor',
      dosage: 'Please verify with doctor',
      form: 'Not specified',
      frequency: 'As prescribed',
      duration: 'As prescribed',
      instructions: 'Consult with your healthcare provider',
      route: 'As prescribed',
      confidence: 0.3
    }],
    doctorName: doctorName,
    hospitalName: hospitalName,
    date: prescriptionDate,
    patientName: 'Not specified',
    confidence: uniqueMedicines.length > 0 ? 0.6 : 0.3,
    totalMedicines: uniqueMedicines.length,
    notes: uniqueMedicines.length > 0 ? 'Extracted using enhanced pattern matching' : 'Low confidence extraction - manual review recommended',
    aiAnalysis: false,
    processingMethod: 'Enhanced Regex Pattern Matching'
  };
}


