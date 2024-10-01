 
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import AdminLayout from "layouts/Admin/Admin.js";
import RTLLayout from "layouts/RTL/RTL.js";
import EditProductPage from './views/edit'
import "assets/scss/black-dashboard-react.scss";
import "assets/demo/demo.css";
import "assets/css/nucleo-icons.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import 'react-toastify/dist/ReactToastify.css';
import ThemeContextWrapper from "./components/ThemeWrapper/ThemeWrapper";
import BackgroundColorWrapper from "./components/BackgroundColorWrapper/BackgroundColorWrapper";
import PhoneCameraUpload from "views/camer";
import { ToastContainer } from 'react-toastify';
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <ThemeContextWrapper>
    <BackgroundColorWrapper>
      <BrowserRouter>
      <ToastContainer />
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />} />
          <Route path="/admin/edit-product/:id" element={<EditProductPage/>} exact/>
          <Route path="/admin/camera" element={<PhoneCameraUpload/>} exact/>

          <Route
            path="*"
            element={<Navigate to="/admin/dashboard" replace />}
          />
        </Routes>
       
      </BrowserRouter>
    </BackgroundColorWrapper>
  </ThemeContextWrapper>
);
