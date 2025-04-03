import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Badge,
  IconButton,
} from "@mui/material";
import { ShoppingCart, Person } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          FoodDelivery
        </Typography>
        <Button color="inherit" onClick={() => navigate("/restaurants")}>
          Restaurants
        </Button>
        <Button color="inherit" onClick={() => navigate("/orders")}>
          My Orders
        </Button>
        <IconButton color="inherit" onClick={() => navigate("/cart")}>
          <Badge badgeContent={0} color="error">
            <ShoppingCart />
          </Badge>
        </IconButton>
        <IconButton color="inherit">
          <Person />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
