import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import {
  Box, Button, Typography, CircularProgress, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem
} from '@mui/material';
import './ProductList.css';
import Navbar from "../../components/auth/Navbar";
import { useNavigate } from 'react-router-dom';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState('Dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    fetchProducts(); 
  
    const interval = setInterval(() => {
      fetchProducts(); 
    }, 1000); 
  
    return () => clearInterval(interval); 
  }, []);
  
  const [amount, setAmount] = useState(0); 
  const [change, setChange] = useState(0); 

  // Calculate change whenever amount or quantity changes
  useEffect(() => {
    const totalPrice = calculateTotalPrice();
    setChange(amount - totalPrice);
  }, [amount, quantity, selectedProduct]);

  const handleAmountChange = (e) => {
    const inputAmount = parseFloat(e.target.value) || 0;
    setAmount(inputAmount);
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      setProducts(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch products. Please try again later.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleOrder = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setDeliveryMethod('Dine-in');
    setTableNumber('');
    setDeliveryAddress('');
    setOpenModal(true);
  };

  const handleAddOrder = async () => {
    try {
      const customerName = localStorage.getItem('userName');
      const totalPrice = calculateTotalPrice();
      
      if (!customerName) {
        setError('Please login again');
        return;
      }

      // Validation checks
      if (!quantity || quantity < 1) {
        setError('Please enter a valid quantity (minimum 1)');
        return;
      }

      if (!amount || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (amount < totalPrice) {
        setError(`Insufficient amount. Total price is ₱${totalPrice}`);
        return;
      }

      if (deliveryMethod === 'Dine-in' && !tableNumber) {
        setError('Please enter a table number for Dine-in');
        return;
      }

      if (deliveryMethod === 'To be Delivered' && !deliveryAddress) {
        setError('Please enter a delivery address');
        return;
      }

      const orderData = {
        customer_name: customerName,
        product_name: selectedProduct.product_name,
        product_price: selectedProduct.product_price,
        quantity,
        total_price: totalPrice,
        delivery_method: deliveryMethod,
        table_number: deliveryMethod === 'Dine-in' ? tableNumber : null,
        delivery_address: deliveryMethod === 'To be Delivered' ? deliveryAddress : null,
        amount,
        change,
      };

      console.log("Order data being sent:", orderData);

      const response = await axios.post('http://localhost:5000/api/orders', orderData);
      console.log("Order added:", response.data);

      setOpenModal(false);
      navigate('/customerpage/orderedlist');
    } catch (err) {
      console.error("Error adding order:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Error adding order. Please try again.");
    }
  };

  const handleCancel = () => {
    setOpenModal(false);
  };

  const calculateTotalPrice = () => {
    if (selectedProduct) {
      return quantity * selectedProduct.product_price;
    }
    return 0;
  };

  return (
    <div className="product-list-container">
      <Navbar userRole="customer" handleLogout={handleLogout} />

      {loading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}

      {error && (
        <Snackbar
          open={true}
          autoHideDuration={6000}
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {!loading && !error && products.map((product) => (
        <Box key={product._id} className="product-card">
          <img
            src={product.product_image}
            alt={product.product_name}
            className="product-image"
          />
          <Typography variant="h6" className="product-name">
            {product.product_name}
          </Typography>
          <Typography variant="body1" className="product-price">
            ₱{product.product_price}
          </Typography>
          <Typography variant="body2" className="product-availability">
            {product.available ? 'Available' : 'Out of Stock'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ShoppingCartIcon />}
            onClick={() => handleOrder(product)}
            disabled={!product.available}
          >
            Order
          </Button>
        </Box>
      ))}

      <Dialog open={openModal} onClose={handleCancel}>
        <DialogTitle>Place Your Order</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <>
              <Typography variant="h6" gutterBottom>
                {selectedProduct.product_name}
              </Typography>

              <TextField
                label="Quantity"
                type="number"
                fullWidth
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                margin="normal"
              />

              <TextField
                label="Total Price"
                type="text"
                fullWidth
                value={`₱${calculateTotalPrice()}`}
                margin="normal"
                InputProps={{
                  readOnly: true,
                }}
              />
              
              <TextField
              label="Amount"
              type="number"
              fullWidth
              value={amount}
              onChange={handleAmountChange}
              margin="normal"
            />

            <TextField
              label="Change"
              type="text"
              fullWidth
              value={`₱${change}`}
              margin="normal"
              InputProps={{
                readOnly: true,
              }}
            />

              <TextField
                select
                label="Delivery Method"
                fullWidth
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                margin="normal"
              >
                <MenuItem value="Dine-in">Dine-in</MenuItem>
                <MenuItem value="To be Delivered">To be Delivered</MenuItem>
              </TextField>

              {deliveryMethod === 'Dine-in' && (
                <TextField
                  label="Table Number"
                  type="text"
                  fullWidth
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  margin="normal"
                  required
                />
              )}

              {deliveryMethod === 'To be Delivered' && (
                <TextField
                  label="Delivery Address"
                  type="text"
                  fullWidth
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  margin="normal"
                  required
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
        <Button
          onClick={handleAddOrder}
          variant="contained"
          disabled={
            !quantity || 
            quantity < 1 ||
            !amount || 
            amount <= 0 ||
            amount < calculateTotalPrice() ||
            (deliveryMethod === 'Dine-in' && !tableNumber) ||
            (deliveryMethod === 'To be Delivered' && !deliveryAddress)
          }
        >
          Add Order
        </Button>
          <Button onClick={handleCancel}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
