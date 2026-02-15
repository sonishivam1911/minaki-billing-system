import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';
import '../styles/QRScanner.css';

/**
 * QRScanner Component
 * Camera-based QR code scanner for product search
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether scanner modal is open
 * @param {Function} props.onClose - Callback to close scanner
 * @param {Function} props.onScanSuccess - Callback when QR code is successfully scanned (receives decoded text)
 */
export const QRScanner = ({ isOpen, onClose, onScanSuccess }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const html5QrCodeRef = useRef(null);

  // Cleanup on unmount or when modal closes
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && scanning) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current.clear();
            html5QrCodeRef.current = null;
          })
          .catch((err) => {
            console.error('Error stopping scanner:', err);
          });
      }
    };
  }, [scanning]);

  // Start scanning
  const startScanning = async () => {
    try {
      setError(null);
      setScanning(true);

      // Check if element exists
      const element = document.getElementById('qr-reader');
      if (!element) {
        throw new Error('Scanner element not found');
      }

      // Initialize scanner if not already initialized
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      }

      // Request camera permissions
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length === 0) {
        throw new Error('No cameras found');
      }

      setCameraPermission('granted');

      // Start scanning with the first available camera
      const cameraId = devices[0].id;
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCodeRef.current.start(
        cameraId,
        config,
        (decodedText) => {
          // Success callback
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Error callback - ignore most errors as they're just scanning attempts
          // Only show actual errors
          if (errorMessage && !errorMessage.includes('NotFoundException')) {
            // Don't set error for common scanning errors
          }
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError(err.message || 'Failed to start camera. Please check permissions.');
      setCameraPermission('denied');
      setScanning(false);
    }
  };

  // Stop scanning
  const stopScanning = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        setScanning(false);
        setError(null);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  // Handle successful scan
  const handleScanSuccess = async (decodedText) => {
    try {
      // Stop scanning
      await stopScanning();
      
      // Call success callback
      if (onScanSuccess) {
        onScanSuccess(decodedText);
      }
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Error handling scan success:', err);
      setError('Error processing scanned code');
    }
  };

  // Handle close
  const handleClose = async () => {
    await stopScanning();
    setError(null);
    setCameraPermission(null);
    onClose();
  };

  // Start scanning when modal opens (with delay to ensure DOM is ready)
  useEffect(() => {
    if (isOpen && !scanning && !html5QrCodeRef.current) {
      const timer = setTimeout(() => {
        startScanning();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="qr-scanner-modal">
      <div className="qr-scanner-overlay" onClick={handleClose} />
      <div className="qr-scanner-content">
        <div className="qr-scanner-header">
          <h2>Scan QR Code</h2>
          <button className="qr-scanner-close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className="qr-scanner-body">
          {error && (
            <div className="qr-scanner-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {cameraPermission === 'denied' && (
            <div className="qr-scanner-error">
              <AlertCircle size={20} />
              <span>
                Camera permission denied. Please enable camera access in your browser settings.
              </span>
            </div>
          )}

          <div id="qr-reader" className="qr-reader-container" />

          {!scanning && !error && (
            <div className="qr-scanner-instructions">
              <Camera size={48} />
              <p>Click "Start Scanning" to begin</p>
              <button className="btn btn-primary" onClick={startScanning}>
                Start Scanning
              </button>
            </div>
          )}

          {scanning && (
            <div className="qr-scanner-status">
              <div className="scanning-indicator">
                <div className="scanning-dot" />
                <span>Scanning...</span>
              </div>
              <p className="scanning-hint">
                Point your camera at a QR code
              </p>
            </div>
          )}
        </div>

        <div className="qr-scanner-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          {scanning && (
            <button className="btn btn-secondary" onClick={stopScanning}>
              Stop Scanning
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

