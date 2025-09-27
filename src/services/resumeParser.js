import mammoth from 'mammoth';

export const parseResume = async (file) => {
  try {
    let text = '';
    
    if (file.type === 'application/pdf') {
      text = await parsePDF(file);
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      text = await parseDOCX(file);
    } else {
      throw new Error('Unsupported file type. Please upload PDF or DOCX file.');
    }

    console.log('Extracted text:', text); // Debug log
    const extractedInfo = extractContactInfo(text);
    console.log('Extracted info:', extractedInfo); // Debug log
    
    return {
      text,
      ...extractedInfo
    };
  } catch (error) {
    console.error('Resume parsing error:', error);
    throw new Error('Failed to parse resume. Please check the file format.');
  }
};

const parsePDF = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Using PDF.js from CDN for proper PDF parsing
        if (typeof window !== 'undefined' && window.pdfjsLib) {
          const arrayBuffer = e.target.result;
          const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + ' ';
          }
          
          resolve(fullText.trim());
        } else {
          // Fallback: Load PDF.js dynamically
          await loadPDFJS();
          const arrayBuffer = e.target.result;
          const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + ' ';
          }
          
          resolve(fullText.trim());
        }
      } catch (error) {
        console.error('PDF parsing error:', error);
        // Fallback to basic text extraction
        try {
          const basicText = await extractBasicTextFromPDF(e.target.result);
          resolve(basicText);
        } catch (fallbackError) {
          reject(new Error('Failed to parse PDF file'));
        }
      }
    };
    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsArrayBuffer(file);
  });
};

const loadPDFJS = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });
};

const extractBasicTextFromPDF = async (arrayBuffer) => {
  // Improved basic PDF text extraction as fallback
  const uint8Array = new Uint8Array(arrayBuffer);
  const text = new TextDecoder('latin1').decode(uint8Array);
  
  // Extract text between 'BT' and 'ET' markers (text objects in PDF)
  const textRegex = /BT\s+(.*?)\s+ET/gs;
  const matches = text.match(textRegex) || [];
  
  let extractedText = '';
  matches.forEach(match => {
    // Extract text from PDF commands
    const textMatch = match.match(/\((.*?)\)/g);
    if (textMatch) {
      textMatch.forEach(txt => {
        const cleanText = txt.replace(/[()]/g, '').trim();
        if (cleanText && cleanText.length > 1) {
          extractedText += cleanText + ' ';
        }
      });
    }
  });
  
  // If no text found, try alternative extraction
  if (!extractedText.trim()) {
    const streamRegex = /stream\s+(.*?)\s+endstream/gs;
    const streamMatches = text.match(streamRegex) || [];
    
    streamMatches.forEach(stream => {
      const content = stream.replace(/^stream\s+/, '').replace(/\s+endstream$/, '');
      const readableText = content.replace(/[^\x20-\x7E]/g, ' ').trim();
      if (readableText.length > 10) {
        extractedText += readableText + ' ';
      }
    });
  }
  
  return extractedText.trim() || 'Could not extract text from PDF';
};

const parseDOCX = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const result = await mammoth.extractRawText({ arrayBuffer });
        resolve(result.value);
      } catch (error) {
        console.error('DOCX parsing error:', error);
        reject(new Error('Failed to parse DOCX file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read DOCX file'));
    reader.readAsArrayBuffer(file);
  });
};

const extractContactInfo = (text) => {
  const info = {
    name: null,
    email: null,
    phone: null
  };

  if (!text || text.trim().length === 0) {
    console.warn('No text provided for extraction');
    return info;
  }

  console.log('Extracting from text:', text.substring(0, 500)); // Debug log

  // Extract email with improved regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatches = text.match(emailRegex);
  if (emailMatches && emailMatches.length > 0) {
    // Filter out common non-email patterns
    const validEmails = emailMatches.filter(email => 
      !email.includes('example.com') && 
      !email.includes('test.com') &&
      email.includes('.')
    );
    if (validEmails.length > 0) {
      info.email = validEmails[0].toLowerCase();
    }
  }

  // Extract phone number with improved regex for Indian and international formats
  const phoneRegexes = [
    /(?:\+91|91)?[-.\s]?[6-9]\d{9}/g, // Indian mobile numbers
    /(?:\+1)?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // US/Canada
    /(?:\+\d{1,3})?[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, // International
  ];
  
  for (const regex of phoneRegexes) {
    const phoneMatches = text.match(regex);
    if (phoneMatches && phoneMatches.length > 0) {
      let phone = phoneMatches[0].replace(/[^\d+]/g, '');
      // Remove leading 1 for US numbers or 91 for Indian numbers
      if (phone.startsWith('91') && phone.length === 12) {
        phone = phone.substring(2);
      } else if (phone.startsWith('1') && phone.length === 11) {
        phone = phone.substring(1);
      }
      if (phone.length >= 10) {
        info.phone = phone;
        break;
      }
    }
  }

  // Extract name with improved heuristics
  const lines = text.split(/[\n\r]+/).map(line => line.trim()).filter(line => line.length > 0);
  
  // Look for name patterns in the first few lines
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    
    // Skip lines that are clearly not names
    if (
      line.includes('@') || // Email
      /\d{3,}/.test(line) || // Contains 3+ consecutive digits
      /^(resume|cv|curriculum vitae|address|phone|email|mobile|tel|contact)/i.test(line) || // Common headers
      line.length < 3 || // Too short
      line.length > 50 || // Too long
      /[^a-zA-Z\s.,'-]/.test(line) || // Contains unusual characters
      /\b(street|road|avenue|drive|lane|city|state|zip|pincode)\b/i.test(line) // Address keywords
    ) {
      continue;
    }
    
    // Check if it looks like a name (2-4 words, reasonable length)
    const words = line.split(/\s+/).filter(word => word.length > 0);
    if (words.length >= 2 && words.length <= 4) {
      // All words should start with capital letter and be reasonable length
      const isValidName = words.every(word => 
        /^[A-Z][a-z]+$/.test(word) && 
        word.length >= 2 && 
        word.length <= 20
      );
      
      if (isValidName) {
        info.name = line;
        break;
      }
    }
  }

  // If no name found, try alternative patterns
  if (!info.name) {
    const namePatterns = [
      /^([A-Z][a-z]+\s+[A-Z][a-z]+)/m, // First Last
      /Name[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i, // Name: First Last
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const candidateName = match[1].trim();
        if (candidateName.length >= 5 && candidateName.length <= 50) {
          info.name = candidateName;
          break;
        }
      }
    }
  }

  console.log('Final extracted info:', info); // Debug log
  return info;
};