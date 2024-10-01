import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';
import { supabase } from '../supabaseClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  TextField,
  Pagination,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const ITEMS_PER_PAGE = 10;

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCounterPrice, setTotalCounterPrice] = useState(0); // New state to store total price for selected products

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm]);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('hsn', { ascending: true }); // Ordering by HSN

      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,collection_name.ilike.%${searchTerm}%,hsn.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching products:', error.message);
        return;
      }

      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const paginatedProducts = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);

      // Calculate total price of products selected for the counter
      const totalPrice = data
        .filter((product) => product.slct_for_counter) // Filter products selected for the counter
        .reduce((acc, product) => acc + product.price, 0); // Sum the prices

      setProducts(paginatedProducts);
      setTotalPages(Math.ceil(data.length / ITEMS_PER_PAGE));
      setTotalCounterPrice(totalPrice); // Set the total counter price
    } catch (error) {
      console.error('Error fetching products:', error.message);
    }
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleDelete = async () => {
    setOpenDeleteModal(false);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);
      if (error) {
        console.error('Error deleting product:', error.message);
      } else {
        fetchProducts(); // Refresh the product list after deletion
      }
    } catch (error) {
      console.error('Error deleting product:', error.message);
    }
  };

  const handleImageClick = (url) => {
    setImageModal({ isOpen: true, imageUrl: url });
  };

  const toggleSelectForCounter = async (product) => {
    try {
      const updatedValue = !product.slct_for_counter;
      const { error } = await supabase
        .from('products')
        .update({ slct_for_counter: updatedValue })
        .eq('id', product.id);
      
      if (error) {
        console.error('Error updating product:', error.message);
        return;
      }

      fetchProducts(); // Refresh the product list to reflect changes
    } catch (error) {
      console.error('Error updating product:', error.message);
    }
  };

  return (
    <div className="content">
      {/* Search Bar */}
      <TextField
        label="Search by HSN, Name, Collection, Category"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
        InputProps={{
          style: { backgroundColor: 'black', color: 'white' },
        }}
        InputLabelProps={{
          style: { color: 'white' },
        }}
        style={{ marginBottom: '20px' }}
      />

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>HSN</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Collection</TableCell>
              <TableCell>Stock Photo</TableCell>
              <TableCell align="center">Actions</TableCell>
              <TableCell align="center">Select for Counter</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.hsn}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.price}{"/-"}</TableCell>
                <TableCell>{product.size}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.collection_name}</TableCell>
                <TableCell>
                  {product.stock_photo ? (
                    <span
                      style={{ width: '50px', height: '50px', objectFit: 'contain', cursor: 'pointer' }}
                      onClick={() => handleImageClick(`${process.env.REACT_APP_SUPA_URL}/storage/v1/object/public/product-images/${product.stock_photo}`)}
                    >View</span>
                  ) : (
                    'No Image'
                  )}
                </TableCell>
                <TableCell align="center">
                  <Link to={`/admin/edit-product/${product.id}`}>
                    <IconButton color="warning">
                      <EditIcon />
                    </IconButton>
                  </Link>
                  <IconButton
                    color="error"
                    onClick={() => {
                      setProductToDelete(product);
                      setOpenDeleteModal(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => toggleSelectForCounter(product)}>
                    {product.slct_for_counter ? (
                      <FavoriteIcon color='red' style={{ color: 'red' }} />
                    ) : (
                      <FavoriteBorderIcon style={{ color: 'black' }} />
                    )}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {!searchTerm && (
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
          sx={{
            '& .MuiPaginationItem-root': {
              color: 'white',
              backgroundColor: 'black',
              '&.Mui-selected': {
                backgroundColor: 'gray',
                color: 'white',
              },
            },
          }}
          style={{ marginTop: '20px', justifyContent: 'center', display: 'flex' }}
        />
      )}

      {/* Display total price for selected products */}
      <div style={{ marginTop: '20px', fontWeight: 'bold', color: 'white' }}>
        Total Price of Selected Products for Counter: ₹{totalCounterPrice}/-
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={openDeleteModal} toggle={() => setOpenDeleteModal(false)}>
        <ModalHeader toggle={() => setOpenDeleteModal(false)}>
          Delete Product
        </ModalHeader>
        <ModalBody>
          Are you sure you want to delete this product?
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setOpenDeleteModal(false)}>
            Cancel
          </Button>
          <Button color="danger" onClick={handleDelete}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>

      {/* Full Image Modal */}
      <Modal style={{ transform: 'translate(0%,0%)' }} isOpen={imageModal.isOpen} toggle={() => setImageModal({ isOpen: false, imageUrl: '' })}>
        <ModalHeader toggle={() => setImageModal({ isOpen: false, imageUrl: '' })}>
          Product Image
        </ModalHeader>
        <ModalBody>
          <img
            src={imageModal.imageUrl}
            alt="Product"
            style={{ width: '100%', height: 'auto' }}
          />
        </ModalBody>
      </Modal>
    </div>
  );
};

export default ProductList;
