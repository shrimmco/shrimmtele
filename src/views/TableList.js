// src/pages/ProductList.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Table,
  Row,
  Col,
  Pagination,
  PaginationItem,
  PaginationLink,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';
import { supabase } from '../supabaseClient';

const ITEMS_PER_PAGE = 10;

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: '' });

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const fetchProducts = async () => {
    try {
      const { count, data, error } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (error) {
        console.error('Error fetching products:', error.message);
      } else {
        setProducts(data);
        setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error('Error fetching products:', error.message);
    }
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDelete = async () => {
    setOpenDeleteModal(false);
    try {
      const { error } = await supabase.from('products').delete().eq('id', productToDelete.id);
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

  return (
    <div className="content">
      <Row>
        <Col md="12">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">Product List</CardTitle>
            </CardHeader>
            <CardBody>
              <Table className="tablesorter" responsive>
                <thead className="text-primary">
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Size</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Discount</th>
                    <th>Stock Photo</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.price}{"/-"}</td>
                      <td>{product.size}</td>
                      <td>{product.category}</td>
                      <td>{product.description}</td>
                      <td>{product.discount}%</td>
                      <td>
                        {product.stock_photo ? (
                          <img
                            src={`${process.env.REACT_APP_SUPA_URL}/storage/v1/object/public/product-images/${product.stock_photo}`}
                            alt={product.name}
                            style={{ width: '50px', height: '50px', objectFit: 'contain', cursor: 'pointer' }}
                            onClick={() => handleImageClick(`${process.env.REACT_APP_SUPA_URL}/storage/v1/object/public/product-images/${product.stock_photo}`)}
                          />
                        ) : (
                          'No Image'
                        )}
                      </td>
                      <td className="text-center">
                        <Link to={`/admin/edit-product/${product.id}`}>
                          <Button color="warning" className="btn-sm">Edit</Button>
                        </Link>
                        <Button
                          color="danger"
                          className="btn-sm"
                          onClick={() => {
                            setProductToDelete(product);
                            setOpenDeleteModal(true);
                          }}
                          style={{ marginLeft: '10px' }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Pagination>
                <PaginationItem disabled={currentPage === 1}>
                  <PaginationLink previous onClick={() => handlePageChange(currentPage - 1)} />
                </PaginationItem>
                {[...Array(totalPages).keys()].map((number) => (
                  <PaginationItem key={number + 1} active={number + 1 === currentPage}>
                    <PaginationLink onClick={() => handlePageChange(number + 1)}>
                      {number + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem disabled={currentPage === totalPages}>
                  <PaginationLink next onClick={() => handlePageChange(currentPage + 1)} />
                </PaginationItem>
              </Pagination>
            </CardBody>
          </Card>
        </Col>
      </Row>

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
