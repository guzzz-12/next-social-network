import {useState, useEffect} from "react";
import {useRouter} from "next/router";
import Link from "next/link";
import {Menu, Container, Icon} from "semantic-ui-react";

const Navbar = () => {
  const router = useRouter();

  const [activeLink, setActiveLink] = useState(null);

  useEffect(() => {
    setActiveLink(router.pathname);
  }, [router.pathname]);

  return (
    <Menu fluid borderless>
      <Container text>
        <Link href="/login">
          <Menu.Item
            header
            active={activeLink === "/login"}
            onClick={() => setActiveLink("/login")}
          >
            <Icon size="large" name="sign in" />
            Login
          </Menu.Item>
        </Link>
        <Link href="/signup">
          <Menu.Item
            header
            active={activeLink === "/signup"}
            onClick={() => setActiveLink("/signup")}
          >
            <Icon size="large" name="signup" />
            Signup
          </Menu.Item>
        </Link>
      </Container>
    </Menu>
  )
}

export default Navbar;
