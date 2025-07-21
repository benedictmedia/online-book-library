// client/src/components/Footer.js
import React from 'react';

function Footer() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '20px',
      marginTop: 'auto', // Push footer to the bottom
      backgroundColor: '#1f1212ff', // Light background for visibility
      borderTop: '1px solid #1b1010ff', // Separator line
      width: '100%', // Ensure it spans full width
      boxSizing: 'border-box' // Include padding in width
    }}>
      <p> All rights reserved &copy; 2025. </p>
      {/* Add your contact details below */}
      <p>
        Contact: <a href="mailto:dotsegideon2@gmail.com">dotsegideon2@gmail.com</a> | Phone: +233 559924589
      </p>
    </footer>
  );
}

export default Footer;