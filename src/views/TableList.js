import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import { PDFDocument, rgb } from 'pdf-lib';  // Import pdf-lib
import fontkit from '@pdf-lib/fontkit';
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
import LabelIcon from '@mui/icons-material/Label';
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
  const iframeRef = useRef(null);
  const getTextWidth = (text, fs, mul) => {
    return text.length * (fs * mul);
  };
  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm]);




  const printLabel = async ({name, price, weight, hsn, diamond_weight, kt}) => {

    // Check required fields
    if (name === '' || price === '' || weight === '' || hsn === '') {
      toast('Please enter Name, Price, Weight, and HSN code.');
      return;
    }

    try {
      // Fetch the PDF from Supabase
      const { data, error } = await supabase.storage
        .from('labelpdf')
        .download(`labelfinal.pdf`);

      if (error) {
        throw new Error('Error fetching the PDF from Supabase: ' + error.message);
      }

      const { data: fontData, error: fontError } = await supabase.storage
        .from('labelpdf')
        .download('cpb.ttf');

      if (fontError) {
        throw new Error('Error fetching the font from Supabase: ' + fontError.message);
      }

      // Load the existing PDF into pdf-lib
      const pdfBytes = await data.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      pdfDoc.registerFontkit(fontkit);

      // Load the bold font
      const fontBytes = await fontData.arrayBuffer();
      const boldFont = await pdfDoc.embedFont(fontBytes);

      // Get the first page of the PDF to modify
      const page = pdfDoc.getPages()[0];

      // Define the font sizes and color for the text
      const fontSizeNormal = 7; // Normal font size
      const fontSizeSmall = 5;  // Smaller font size for word wrap
      const color = rgb(0, 0, 0); // Black text

      // Function to draw text with word wrapping
      const drawTextWithWrap = (text, x, y, maxWidth, font, size, size2) => {
        let result = text.charAt(0).toUpperCase() + text.slice(1);
        const words = result.split(' ');
        let line = '';
        let lineHeight = 8; // Adjust line height as needed
        let yPosition = y;
        let fsize = size
        for (const word of words) {
          const testLine = line + word + ' ';
          const testWidth = getTextWidth(testLine, size, 0.6);

          if (testWidth > maxWidth) {
            fsize = size2
            // If the line is too wide, draw the current line and start a new one
            page.drawText(line, { x, y: yPosition, size: fsize, color, font });
            line = word + ' '; // Start new line
            yPosition -= 4; // Move down for the next line
          } else {
            line = testLine; // Update line
          }
        }

        // Draw any remaining text in the line
        if (line) {
          page.drawText(line, { x, y: yPosition, size: fsize, color, font });
        }
      };

      // Draw the product name with word wrapping
      drawTextWithWrap(name, 4, 38, 75, boldFont, fontSizeNormal, fontSizeSmall);

      // Draw other fields
      page.drawText(`MRP:${price}/-`, { x: 4, y: 16, size: 5, color, font: boldFont });

      page.drawText(`G.wt:${weight}g`, { x: 4, y: 28, size: 5, color, font: boldFont });
      page.drawText(`#${hsn}`, { x: 70 - getTextWidth(`#${hsn}`, 6, 0.6), y: 24, size: 6, color, font: boldFont });

      if (diamond_weight !== null) {
        let nwt = weight - diamond_weight * 0.200
        page.drawText(`N.wt:${nwt.toFixed(3)}g`, { x: 4, y: 24, size: 5, color, font: boldFont });
        page.drawText(`Dia.wt:${diamond_weight} ${kt}kt`, { x: 4, y: 20, size: 5, color, font: boldFont });
      }
      else {
        page.drawText(`Pt:${"92.50"}`, { x: 4, y: 20, size: 5, color, font: boldFont });

        page.drawText(`N.wt:${weight}g`, { x: 4, y: 24, size: 5, color, font: boldFont });

      }

      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();

      // Create a Blob URL for the modified PDF
      const modifiedPdfBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const pdfBlobUrl = URL.createObjectURL(modifiedPdfBlob);

      // Set the iframe source to the Blob URL
      iframeRef.current.src = pdfBlobUrl;

      // Wait for the iframe to load and then trigger print
      iframeRef.current.onload = () => {
        iframeRef.current.contentWindow.print(); // Trigger the print dialog
      };

    } catch (error) {
      console.error('Error fetching or printing the PDF:', error.message);
      toast.error('Error fetching or printing the PDF: ' + error.message);
    }
  };

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
                  <IconButton
                    color="success"
                    onClick={() => {
                     printLabel(product)
                    }}
                  >
                    <LabelIcon />
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
      <iframe
        ref={iframeRef}
        style={{ display: 'none' }} // Hide the iframe
        title="PDF Preview"
      />
    </div>
  );
};

export default ProductList;
