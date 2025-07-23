import { OTPRecord } from '../types';

// Keywords for filtering messages
const DEFAULT_KEYWORDS = ['otp', 'code', 'verification', 'login', 'verify', 'password', 'auth', 'authenticate', 'security'];

// Cache to prevent duplicate OTPs
const otpCache = new Set<string>();
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Extract OTP from message text using simple digit extraction
 */
export const extractOTP = (
    message: string,
    minLength: number = 4,
    maxLength: number = 8
): string | null => {
    console.log('Extracting OTP from message:', message);
    console.log('OTP length range:', minLength, 'to', maxLength);
    
    // Find all sequences of digits in the message
    const digitMatches = message.match(/\d+/g);
    
    if (!digitMatches) {
        console.log('No digits found in message');
        return null;
    }
    
    console.log('Found digit sequences:', digitMatches);
    
    // Find the first sequence that matches our length criteria
    for (const digits of digitMatches) {
        if (digits.length >= minLength && digits.length <= maxLength) {
            console.log('Found OTP:', digits);
            return digits;
        }
    }
    
    console.log('No OTP found matching length criteria');
    return null;
};

/**
 * Check if message contains any of the keywords (case insensitive)
 */
export const containsKeywords = (
    message: string,
    keywords: string[] = DEFAULT_KEYWORDS
): boolean => {
    const lowerMessage = message.toLowerCase();
    console.log('Checking keywords in message:', lowerMessage);
    console.log('Keywords to check:', keywords);
    
    const found = keywords.some(keyword => {
        const lowerKeyword = keyword.toLowerCase();
        const contains = lowerMessage.includes(lowerKeyword);
        if (contains) {
            console.log('Found keyword:', lowerKeyword);
        }
        return contains;
    });
    
    console.log('Keywords found:', found);
    return found;
};

/**
 * Process incoming message to extract OTP
 */
export const processMessage = (
    sender: string,
    message: string,
    keywords: string[] = DEFAULT_KEYWORDS,
    minLength: number = 4,
    maxLength: number = 8
): OTPRecord | null => {
    console.log('Processing message:', { sender, message, keywords, minLength, maxLength });

    // Check if message contains any keywords
    const hasKeywords = containsKeywords(message, keywords);
    console.log('Keywords check:', hasKeywords);

    if (!hasKeywords) {
        console.log('Message does not contain required keywords');
        return null;
    }

    // Extract OTP
    const otp = extractOTP(message, minLength, maxLength);
    console.log('OTP extraction result:', otp);

    if (!otp) {
        console.log('No OTP found in message');
        return null;
    }

    // Check cache to prevent duplicates
    const cacheKey = `${sender}:${otp}`;
    if (otpCache.has(cacheKey)) {
        console.log('OTP already processed (duplicate)');
        return null;
    }

    // Add to cache with expiry
    otpCache.add(cacheKey);
    setTimeout(() => {
        otpCache.delete(cacheKey);
    }, CACHE_EXPIRY_MS);

    console.log('Creating OTP record');

    // Create OTP record
    return {
        id: Math.random().toString(36).substring(2, 15),
        otp,
        source: 'sms',
        sender,
        message,
        timestamp: new Date(),
        forwarded: false,
        forwardingMethod: null,
    };
};

/**
 * Get default keywords
 */
export const getDefaultKeywords = (): string[] => {
    return [...DEFAULT_KEYWORDS];
};