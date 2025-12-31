import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Pagination, Stack
} from '@mui/material';
import "./CustomerOrder.css";
import Navbar from "../../components/auth/Navbar";
import axios from 'axios';

function CustomerOrder() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const [productStocks, setProductStocks] = useState({});
  const [currentPagePending, setCurrentPagePending] = useState(1);
  const [currentPageDelivered, setCurrentPageDelivered] = useState(1);
  const rowsPerPage = 5;


  useEffect(() => {
    fetchOrders(); 
      fetchStocks();

    const interval = setInterval(() => {
      fetchOrders(); 
        fetchStocks();

    }, 1000); 
    
    return () => clearInterval(interval); 
  }, []);

  const fetchStocks = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/stocks');
    // Map product name to total stock
    const stockMap = {};
    res.data.forEach(stock => {
      const prodName = stock.product?.product_name || stock.product;
      stockMap[prodName] = (stockMap[prodName] || 0) + stock.quantity;
    });
    setProductStocks(stockMap);
  } catch (err) {
    console.error("Error fetching stocks:", err);
  }
};

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders');
      console.log("Fetched Orders:", res.data);
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const handleDeliverOrder = async (id) => {
    try {
      const order = orders.find(o => o._id === id);
      const stock = productStocks[order.product_name] || 0;

      if (stock < 20) {
        alert(`Warning: Stock for "${order.product_name}" is low: ${stock} left!`);
      }

      await axios.put(`http://localhost:5000/api/orders/${id}`, { status: 'Delivered' });
      fetchOrders();
    } catch (err) {
      console.error("Error delivering order:", err);
    }
  };

  const handleDeleteOrder = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/orders/${id}`);
      fetchOrders();
    } catch (err) {
      console.error("Error deleting order:", err);
    }
  };

  const handleAcceptOrder = async (id) => {
  try {
    await axios.put(`http://localhost:5000/api/orders/${id}/accept`);
    fetchOrders();
  } catch (err) {
    console.error("Error accepting order:", err);
  }
};

  // Pagination helpers
  const pendingOrders = orders.filter(order => order.status !== 'Delivered');
  const deliveredOrders = orders.filter(order => order.status === 'Delivered');

  const totalPagesPending = Math.ceil(pendingOrders.length / rowsPerPage);
  const totalPagesDelivered = Math.ceil(deliveredOrders.length / rowsPerPage);

  const indexOfLastPending = currentPagePending * rowsPerPage;
  const indexOfFirstPending = indexOfLastPending - rowsPerPage;
  const currentPendingOrders = pendingOrders.slice(indexOfFirstPending, indexOfLastPending);

  const indexOfLastDelivered = currentPageDelivered * rowsPerPage;
  const indexOfFirstDelivered = indexOfLastDelivered - rowsPerPage;
  const currentDeliveredOrders = deliveredOrders.slice(indexOfFirstDelivered, indexOfLastDelivered);

  const handlePendingPageChange = (event, value) => {
    setCurrentPagePending(value);
  };

  const handleDeliveredPageChange = (event, value) => {
    setCurrentPageDelivered(value);
  };

  return (
    <div className="customer-order-container">
      <Navbar userRole="admin" handleLogout={() => { localStorage.removeItem('user'); navigate('/'); }} />

      <div className="customer-order-box">
        {/* PENDING AND ACCEPTED ORDERS SECTION */}
        <section style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginTop: '0', marginBottom: '0' }}>Pending & Accepted Orders</h2>
          <TableContainer component={Paper} sx={{ overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                              <TableCell>Customer Name</TableCell> 
                <TableCell>Product Name</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Total Price</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Change</TableCell>
                <TableCell>Delivery Method</TableCell>
                <TableCell>Table No. / Address</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell> 
              </TableRow>
            </TableHead>
            <TableBody>
            {currentPendingOrders.map((order) => (
                <TableRow key={order._id}>
                                  <TableCell>{order.customer_name}</TableCell> {/* Add this line */}

                  <TableCell>{order.product_name}</TableCell>
                  <TableCell>₱{order.product_price}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>₱{order.total_price}</TableCell>
                  <TableCell>₱{order.amount}</TableCell>
                  <TableCell>₱{order.change}</TableCell>
                  <TableCell>{order.delivery_method}</TableCell>
                  <TableCell>
                    {order.delivery_method === 'Dine-in' ? order.table_number : order.delivery_address}
                  </TableCell>
                  <TableCell>
                    <span style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      backgroundColor: order.status === 'Pending' ? '#fff3cd' : '#e8f5e9',
                      color: order.status === 'Pending' ? '#b39200' : '#1b5e20',
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      display: 'inline-block'
                    }}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {order.status === 'Pending' && (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleAcceptOrder(order._id)}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        Accept Order
                      </Button>
                    )}
                    <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleDeliverOrder(order._id)}
                    size="small"
                    disabled={productStocks[order.product_name] === 0}
                  >
                    Deliver Order
                  </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteOrder(order._id)}
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination for Pending Orders */}
        <Stack direction="row" justifyContent="center" sx={{ mt: 0.15, mb: 0, py: 0.3 }}>
          <Pagination 
            count={totalPagesPending} 
            page={currentPagePending} 
            onChange={handlePendingPageChange}
            color="primary"
            size="small"
          />
        </Stack>
        </section>

        {/* DELIVERED ORDERS SECTION */}
        <section style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginTop: '0', marginBottom: '0' }}>Delivered Orders</h2>
          <TableContainer component={Paper} sx={{ overflow: 'hidden' }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#e8f5e9' }}>
              <TableRow>
                <TableCell><strong>Customer Name</strong></TableCell> 
                <TableCell><strong>Product Name</strong></TableCell>
                <TableCell><strong>Price</strong></TableCell>
                <TableCell><strong>Quantity</strong></TableCell>
                <TableCell><strong>Total Price</strong></TableCell>
                <TableCell><strong>Amount</strong></TableCell>
                <TableCell><strong>Change</strong></TableCell>
                <TableCell><strong>Delivery Method</strong></TableCell>
                <TableCell><strong>Table No. / Address</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell> 
              </TableRow>
            </TableHead>
            <TableBody>
            {currentDeliveredOrders.length > 0 ? (
              currentDeliveredOrders.map((order) => (
                  <TableRow key={order._id} sx={{ backgroundColor: '#f1f8f6' }}>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{order.product_name}</TableCell>
                    <TableCell>₱{order.product_price}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>₱{order.total_price}</TableCell>
                    <TableCell>₱{order.amount}</TableCell>
                    <TableCell>₱{order.change}</TableCell>
                    <TableCell>{order.delivery_method}</TableCell>
                    <TableCell>
                      {order.delivery_method === 'Dine-in' ? order.table_number : order.delivery_address}
                    </TableCell>
                    <TableCell>
                      <span style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '4px',
                        backgroundColor: '#e8f5e9',
                        color: '#1b5e20',
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        display: 'inline-block'
                      }}>
                        Delivered
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteOrder(order._id)}
                        size="small"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                  <strong>No delivered orders yet</strong>
                </TableCell>
              </TableRow>
            )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination for Delivered Orders */}
        <Stack direction="row" justifyContent="center" sx={{ mt: 0.15, mb: 0, py: 0.3 }}>
          <Pagination 
            count={totalPagesDelivered} 
            page={currentPageDelivered} 
            onChange={handleDeliveredPageChange}
            color="primary"
            size="small"
          />
        </Stack>
        </section>
      </div>
    </div>
  );
}

export default CustomerOrder;