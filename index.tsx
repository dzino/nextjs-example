import { withIronSession } from "next-iron-session"
import { sessionOptions } from "../components/session"
import { useRouter } from "next/router"
import { useState, useEffect, StrictMode } from "react"
import Styles from "../styles/Home.module.scss"
import PostM, { SchemaI } from "../models/Post"
import Meta from "../components/meta"
import Header from "../components/header"
import Description from "../components/description"
import Slider from "../components/slider"
import AccordionSlider from "../components/accordionSlider"
import Categories from "../components/categories.json"

export const categories: {
  id: string
  header: string
  description: string
  image: string
}[] = Categories

interface MySchemaI extends SchemaI {
  _id: string
  __v: number
}

interface MyProps {
  checkUser: boolean
  posts: MySchemaI[]
}

export default function Home<P extends MyProps>(props: P) {
  const router = useRouter()
  const [category, setCategory] = useState<[null | string, boolean]>([
    null,
    false,
  ])
  const query = router.query as { pageYOffset?: string }
  let [button, setButton] = useState<string>("")

  /* Scrolling along the y-axis */
  useEffect((): void => {
    if (query?.pageYOffset) {
      setTimeout(() => {
        typeof window !== "undefined"
          ? window.scrollTo(0, +query.pageYOffset)
          : undefined
      }, 50)
    }
  }, [])

  /* Show the up button */
  useEffect((): void => {
    const slidersY = getY("#accordionSlider") + 100
    window.onscroll = () => {
      setButton(window.pageYOffset < slidersY ? "" : "show")
    }
  }, [])

  /* Scrolling along the y-axis, before #sliders */
  useEffect((): void => {
    if (category[1]) {
      const slidersY = getY("#sliders")
      typeof window !== "undefined" ? window.scrollTo(0, slidersY) : undefined
    }
  }, [category])

  /** ## Scrolling along the y-axis, before #accordionSlider */
  function intoCategory(): void {
    if (typeof window !== "undefined") {
      const categoryY: number = getY("#accordionSlider")
      typeof window !== "undefined" ? window.scrollTo(0, categoryY) : undefined
    }
  }

  /** ## Y-axis #sliders/#accordionSlider */
  function getY(id: string): number {
    return typeof window !== "undefined"
      ? window.scrollY + document.querySelector(id).getBoundingClientRect().top
      : 0
  }

  function sliders(): JSX.Element[] {
    const posts =
      category[0] !== null
        ? props.posts.filter((v) => v.category === category[0])
        : props.posts
    return posts.map((v, i) => (
      <Slider
        key={`slider${i}`}
        _id={props.checkUser ? v._id : undefined}
        name={typeof v.name === "string" ? v.name : ""}
        description={typeof v.description === "string" ? v.description : ""}
        before={typeof v.image0 === "string" ? `./unloaded/${v.image0}` : ""}
        after={typeof v.image1 === "string" ? `./unloaded/${v.image1}` : ""}
      />
    ))
  }

  const newPost = (): Promise<boolean> =>
    router.push({
      pathname: "/private",
      query: { pageYOffset: window.pageYOffset, _id: "" },
    })

  return (
    <Meta title="Главная страница">
      <StrictMode>
        <div id="button" className={button} onClick={() => intoCategory()}>
          К категориям
        </div>
        <Header />
        <Description />
        <div id="accordionSlider">
          <AccordionSlider
            slides={categories}
            active={category[0]}
            callback={(id) => setCategory([id, true])}
          />
        </div>
        {props.checkUser ? (
          <p className={Styles.color} onClick={newPost}>
            ДОБАВИТЬ ПОСТ
          </p>
        ) : undefined}
        <div id="sliders">{sliders()}</div>
      </StrictMode>
    </Meta>
  )
}

/** ### Authorization check */
export const getServerSideProps = withIronSession(async ({ req, res }) => {
  await fetch(process.env.API_URL + "/api/connect-db")

  const checkUser: boolean =
    req.session.get("user") !== undefined ? true : false

  const posts: MySchemaI[] = JSON.parse(JSON.stringify(await PostM.find()))

  return { props: { checkUser, posts } as MyProps }
}, sessionOptions)
