import React from 'react';
import { Link } from 'react-router-dom';
import { Gem, Phone, Mail, MapPin, Clock, Shield, Award, Truck, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

/**
 * Footer Component
 * Modern ecommerce-style footer with company info, links, features, and cart access
 */
export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { totals } = useCart();
  const hasItemsInCart = totals.itemCount > 0;

  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Brand Section */}
        <div className="footer-section footer-brand">
          <div className="footer-logo">
            <Gem size={32} />
            <div>
              <div className="footer-brand-name">Minaki Billing System</div>
              <div className="footer-brand-tagline">Point of Sale</div>
            </div>
          </div>
          <p className="footer-description">
            Professional jewelry point of sale system designed for modern jewelry retailers. 
            Streamline your sales, manage inventory, and delight customers.
          </p>
          <div className="footer-contact">
            <div className="contact-item">
              <Phone size={16} />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="contact-item">
              <Mail size={16} />
              <span>support@minakibilling.com</span>
            </div>
            <div className="contact-item">
              <MapPin size={16} />
              <span>123 Business District, Mumbai 400001</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3 className="footer-title">Quick Links</h3>
          <ul className="footer-links">
            <li><Link to="/catalog">Product Catalog</Link></li>
            <li>
              <Link 
                to="/customers" 
                className={!hasItemsInCart ? 'disabled-link' : ''}
                onClick={(e) => {
                  if (!hasItemsInCart) {
                    e.preventDefault();
                    alert('Add items to cart first to access customer management');
                  }
                }}
              >
                Customer Management
              </Link>
            </li>
            <li>
              <Link 
                to="/checkout" 
                className={!hasItemsInCart ? 'disabled-link' : ''}
                onClick={(e) => {
                  if (!hasItemsInCart) {
                    e.preventDefault();
                    alert('Add items to cart first to proceed to checkout');
                  }
                }}
              >
                Checkout & Billing
              </Link>
            </li>
            <li><a href="/reports">Sales Reports</a></li>
            <li><a href="/inventory">Inventory</a></li>
          </ul>
        </div>

        {/* Features */}
        <div className="footer-section">
          <h3 className="footer-title">Features</h3>
          <ul className="footer-features">
            <li>
              <Shield size={16} />
              <span>Secure Transactions</span>
            </li>
            <li>
              <Award size={16} />
              <span>Quality Assurance</span>
            </li>
            <li>
              <Truck size={16} />
              <span>Fast Processing</span>
            </li>
            <li>
              <Clock size={16} />
              <span>Real-time Updates</span>
            </li>
          </ul>
        </div>

        {/* Cart & Business Hours */}
        <div className="footer-section">
          <h3 className="footer-title">Shopping Cart</h3>
          <div className="footer-cart">
            <Link 
              to="/cart" 
              className={`footer-cart-button ${!hasItemsInCart ? 'disabled' : ''}`}
              onClick={(e) => {
                if (!hasItemsInCart) {
                  e.preventDefault();
                  alert('Your cart is empty. Add items from the catalog first.');
                }
              }}
            >
              <ShoppingCart size={20} />
              <span>
                {hasItemsInCart 
                  ? `View Cart (${totals.itemCount} items)` 
                  : 'Cart Empty'
                }
              </span>
              {hasItemsInCart && (
                <span className="footer-cart-badge">{totals.itemCount}</span>
              )}
            </Link>
            {hasItemsInCart && (
              <div className="cart-total">
                Total: ₹{totals.subtotal?.toLocaleString() || '0'}
              </div>
            )}
          </div>
          
          <div className="business-hours">
            <h4 className="hours-title">Business Hours</h4>
            <div className="hours-item">
              <span className="day">Monday - Friday</span>
              <span className="time">9:00 AM - 7:00 PM</span>
            </div>
            <div className="hours-item">
              <span className="day">Saturday</span>
              <span className="time">10:00 AM - 6:00 PM</span>
            </div>
            <div className="hours-item">
              <span className="day">Sunday</span>
              <span className="time">12:00 PM - 5:00 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-copyright">
          <p>&copy; {currentYear} Minaki Billing System. All rights reserved.</p>
        </div>
        <div className="footer-legal">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/support">Support</a>
        </div>
      </div>
    </footer>
  );
};