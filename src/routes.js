 
import Dashboard from "views/Dashboard.js";
import Icons from "views/Icons.js";
import ProductForm from "views/ProductForm";
import Notifications from "views/Notifications.js";
import Rtl from "views/Rtl.js";
import TableList from "views/TableList.js";
import Typography from "views/Typography.js";

import UserProfile from "views/UserProfile.js";

var routes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: "tim-icons icon-chart-pie-36",
    component: <Dashboard />,
    layout: "/admin",
  },
  {
    path: "/addproduct",
    name: "Add Product",
    icon: "tim-icons icon-pin",
    component: <ProductForm />,
    layout: "/admin",
  },
  {
    path: "/allproducts",
    name: "All Products",
    icon: "tim-icons icon-puzzle-10",
    component: <TableList />,
    layout: "/admin",
  },
];
export default routes;
