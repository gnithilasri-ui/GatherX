import React,{useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import axios from "axios";
import {
  CalendarDays,
  MapPin,
  Users,
  Search,
  Plus,
  LogIn,
  LogOut,
  LayoutDashboard,
  Ticket,
  ShieldCheck,
  Menu,
  X,
  Clock3,
  Trash2,
  Edit3,
  ChevronRight,
  Sparkles
} from "lucide-react";
import "./styles.css";

const API="http://localhost:5000/api";

const api=axios.create({
  baseURL:API
});

api.interceptors.request.use(config=>{
  const token=localStorage.getItem("eventhub_token");

  if(token){
    config.headers.Authorization=`Bearer ${token}`;
  }

  return config;
});

const categories=[
  "All",
  "Technology",
  "Workshop",
  "Cultural",
  "Sports",
  "Seminar",
  "Conference",
  "Club"
];

const demoEvents=[
  {
    title:"AI & Innovation Summit",
    description:"A hands-on campus summit exploring AI, startups and emerging technologies.",
    category:"Technology",
    type:"Conference",
    date:"2026-10-10",
    time:"10:00 AM",
    location:"Main Auditorium",
    capacity:200,
    registeredCount:128
  },
  {
    title:"Design Thinking Workshop",
    description:"Learn practical design thinking methods through a guided team workshop.",
    category:"Workshop",
    type:"Workshop",
    date:"2026-10-15",
    time:"02:00 PM",
    location:"Innovation Lab",
    capacity:60,
    registeredCount:34
  },
  {
    title:"Campus Cricket League",
    description:"Inter-department cricket tournament with knockout rounds and finals.",
    category:"Sports",
    type:"Tournament",
    date:"2026-10-20",
    time:"08:00 AM",
    location:"College Ground",
    capacity:120,
    registeredCount:82
  }
];

function getSeatsLeft(event){

  if(
    event?.seatsLeft !== undefined &&
    event?.seatsLeft !== null
  ){
    return Math.max(
      Number(event.seatsLeft)||0,
      0
    );
  }

  if(
    event?.availableSeats !== undefined &&
    event?.availableSeats !== null
  ){
    return Math.max(
      Number(event.availableSeats)||0,
      0
    );
  }

  return Math.max(
    Number(event?.capacity||0) -
    Number(event?.registeredCount||0),
    0
  );
}

function normalizeEvent(event){

  const seats=getSeatsLeft(event);

  return {
    ...event,
    seatsLeft:seats,
    availableSeats:seats,
    registeredCount:Number(
      event?.registeredCount||0
    )
  };
}


/* =========================================================
   APP
========================================================= */

function App(){

  const [user,setUser]=useState(
    ()=>{
      try{
        return JSON.parse(
          localStorage.getItem("eventhub_user")||"null"
        );
      }catch{
        return null;
      }
    }
  );

  const [page,setPage]=useState("home");
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(false);
  const [toast,setToast]=useState("");
  const [selected,setSelected]=useState(null);
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("All");
  const [authMode,setAuthMode]=useState("login");
  const [mobile,setMobile]=useState(false);

  useEffect(()=>{

    loadEvents();

  },[]);


  useEffect(()=>{

    if(toast){

      const timer=setTimeout(
        ()=>setToast(""),
        2600
      );

      return ()=>clearTimeout(timer);
    }

  },[toast]);


  async function loadEvents(){

    setLoading(true);

    try{

      const response=await api.get(
        "/events",
        {
          params:{
            search:query,
            category
          }
        }
      );

      let list=Array.isArray(response.data)
        ?response.data
        :(response.data.events||[]);

      /*
        Student registration status
      */

      if(user?.role==="student"){

        try{

          const registrationResponse=
            await api.get(
              "/registrations/mine"
            );

          const registrations=
            registrationResponse
              .data
              ?.registrations||[];

          const registeredEventIds=
            new Set(
              registrations
                .filter(
                  registration=>
                    registration.status===
                    "registered"
                )
                .map(
                  registration=>
                    typeof registration.event===
                    "object"
                      ?registration.event?._id
                      :registration.event
                )
            );

          list=list.map(event=>({

            ...event,

            isRegistered:
              registeredEventIds.has(
                event._id
              )

          }));

        }catch(error){

          console.log(
            "Could not load registration status",
            error
          );

        }

      }

      setEvents(
        list.map(normalizeEvent)
      );

    }catch(error){

      console.error(
        "Failed to load events",
        error
      );

      setEvents(
        demoEvents.map(normalizeEvent)
      );

    }finally{

      setLoading(false);

    }
  }


  useEffect(()=>{

    const timer=setTimeout(
      loadEvents,
      250
    );

    return ()=>clearTimeout(timer);

  },[query,category,user]);


  function logout(){

    localStorage.removeItem(
      "eventhub_token"
    );

    localStorage.removeItem(
      "eventhub_user"
    );

    setUser(null);
    setPage("home");
    setSelected(null);

    setToast(
      "Logged out successfully!"
    );
  }


  function go(nextPage){

    setPage(nextPage);
    setMobile(false);

    window.scrollTo({
      top:0,
      behavior:"smooth"
    });

  }


  async function register(event){

    if(!user){

      setAuthMode("login");
      setPage("auth");

      return;
    }


    if(user.role!=="student"){

      setToast(
        "Only student accounts can register"
      );

      return;
    }


    if(event.isRegistered){

      setToast(
        "You are already registered"
      );

      return;
    }


    try{

      /*
        Correct backend endpoint
      */

      await api.post(
        `/registrations/${event._id}`
      );


      const currentSeatsLeft=
        getSeatsLeft(event);


      const updatedEvent=
        normalizeEvent({

          ...event,

          isRegistered:true,

          registeredCount:
            (event.registeredCount||0)+1,

          seatsLeft:
            Math.max(
              currentSeatsLeft-1,
              0
            ),

          availableSeats:
            Math.max(
              currentSeatsLeft-1,
              0
            )

        });


      setSelected(
        updatedEvent
      );


      setEvents(prev=>
        prev.map(existingEvent=>
          existingEvent._id===
          event._id
            ?updatedEvent
            :existingEvent
        )
      );


      setToast(
        "Registration confirmed!"
      );

    }catch(error){

      setToast(
        error.response
          ?.data
          ?.message||
        "Registration failed"
      );

    }

  }


  return (
    <div className="app">

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <header className="nav">

        <div className="nav-inner">

          <button
            className="brand"
            onClick={()=>
              go("home")
            }
          >

            <span className="brand-mark">
              <Sparkles size={17}/>
            </span>

            <span>
              Event
              <span className="brand-accent">
                Hub
              </span>
            </span>

          </button>


          <nav
            className={
              mobile
                ?"nav-links open"
                :"nav-links"
            }
          >

            <button
              className={
                page==="home"
                  ?"active"
                  :""
              }
              onClick={()=>
                go("home")
              }
            >
              Discover
            </button>


            {user&&(

              <button
                className={
                  page==="dashboard"
                    ?"active"
                    :""
                }
                onClick={()=>
                  go("dashboard")
                }
              >
                <LayoutDashboard size={16}/>
                Dashboard
              </button>

            )}


            {user?.role==="student"&&(

              <button
                className={
                  page==="tickets"
                    ?"active"
                    :""
                }
                onClick={()=>
                  go("tickets")
                }
              >
                <Ticket size={16}/>
                My Registrations
              </button>

            )}


            {user?.role==="organizer"&&(

              <button
                className={
                  page==="create"
                    ?"active"
                    :""
                }
                onClick={()=>
                  go("create")
                }
              >
                <Plus size={16}/>
                Create Event
              </button>

            )}


            {user?.role==="admin"&&(

              <button
                className={
                  page==="admin"
                    ?"active"
                    :""
                }
                onClick={()=>
                  go("admin")
                }
              >
                <ShieldCheck size={16}/>
                Admin
              </button>

            )}


            {!user ? (

              <button
                className="nav-login"
                onClick={()=>
                  go("auth")
                }
              >
                <LogIn size={16}/>
                Login
              </button>

            ): (

              <button
                className="nav-login"
                onClick={logout}
              >
                <LogOut size={16}/>
                Logout
              </button>

            )}

          </nav>


          <button
            className="menu-btn"
            onClick={()=>
              setMobile(!mobile)
            }
          >
            {mobile
              ?<X/>
              :<Menu/>
            }
          </button>

        </div>

      </header>


      {/* =================================================
          HOME
      ================================================= */}

      {page==="home"&&(

        <Home
          events={events}
          loading={loading}
          query={query}
          setQuery={setQuery}
          category={category}
          setCategory={setCategory}
          open={event=>{

            setSelected(event);
            setPage("detail");

          }}
        />

      )}


      {/* =================================================
          DETAIL
      ================================================= */}

      {page==="detail"&&(

        <Detail
          event={selected}
          user={user}
          back={()=>
            go("home")
          }
          register={register}
          setToast={setToast}
        />

      )}


      {/* =================================================
          AUTH
      ================================================= */}

      {page==="auth"&&(

        <Auth
          mode={authMode}
          setMode={setAuthMode}

          onSuccess={(loggedUser,token)=>{

            localStorage.setItem(
              "eventhub_token",
              token
            );

            localStorage.setItem(
              "eventhub_user",
              JSON.stringify(loggedUser)
            );

            setUser(loggedUser);

            setPage("dashboard");

            setToast(
              "Login successful! Welcome back."
            );

          }}

        />

      )}


      {/* =================================================
          CREATE EVENT
      ================================================= */}

      {page==="create"&&(

        <Create
          user={user}

          onDone={()=>{

            setToast(
              "Event published!"
            );

            loadEvents();

            go("home");

          }}

        />

      )}


      {/* =================================================
          DASHBOARD
      ================================================= */}

      {page==="dashboard"&&(

        <Dashboard
          user={user}
          go={go}
        />

      )}


      {/* =================================================
          MY REGISTRATIONS
      ================================================= */}

      {page==="tickets"&&(

        <Tickets/>

      )}


      {/* =================================================
          ADMIN
      ================================================= */}

      {page==="admin"&&(

        <Admin/>

      )}


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer>

        <div>

          <div className="brand footer-brand">

            <span className="brand-mark">
              <Sparkles size={15}/>
            </span>

            Event
            <span className="brand-accent">
              Hub
            </span>

          </div>

          <p>
            One place to discover, create and experience events.
          </p>

        </div>


        <div className="footer-right">
          Built for campus communities · MERN
        </div>

      </footer>


      {toast&&(

        <div className="toast">
          {toast}
        </div>

      )}

    </div>
  );
}


/* =========================================================
   HOME
========================================================= */

function Home({
  events,
  loading,
  query,
  setQuery,
  category,
  setCategory,
  open
}){

  return (
    <main>

      <section className="hero">

        <div className="hero-glow"></div>

        <div className="container hero-content">

          <div className="eyebrow">

            <Sparkles size={15}/>

            YOUR CAMPUS. YOUR EVENTS.

          </div>


          <h1>
            Find your next
            <br/>
            <span>
              great experience.
            </span>
          </h1>


          <p>
            Discover workshops, conferences,
            sports, cultural programs and more —
            all in one place.
          </p>


          <div className="searchbar">

            <Search size={20}/>

            <input
              value={query}
              onChange={e=>
                setQuery(
                  e.target.value
                )
              }
              placeholder="Search events, places or topics..."
            />


            <button
              onClick={()=>
                document
                  .getElementById("events")
                  ?.scrollIntoView({
                    behavior:"smooth"
                  })
              }
            >
              Search
            </button>

          </div>

        </div>

      </section>


      <section
        className="container event-section"
        id="events"
      >

        <div className="section-head">

          <div>

            <span className="eyebrow small">
              EXPLORE
            </span>

            <h2>
              Upcoming events
            </h2>

          </div>


          <div className="filters">

            {categories.map(categoryName=>(

              <button
                key={categoryName}
                className={
                  category===categoryName
                    ?"chip active"
                    :"chip"
                }
                onClick={()=>
                  setCategory(
                    categoryName
                  )
                }
              >
                {categoryName}
              </button>

            ))}

          </div>

        </div>


        {loading ? (

          <div className="loading">
            Loading events...
          </div>

        ): events.length ? (

          <div className="event-grid">

            {events.map((event,index)=>(

              <EventCard
                key={
                  event._id||index
                }
                event={event}
                open={open}
              />

            ))}

          </div>

        ): (

          <div className="empty">
            No events found. Try another search or category.
          </div>

        )}

      </section>

    </main>
  );
}


/* =========================================================
   EVENT CARD
========================================================= */

function EventCard({
  event,
  open
}){

  const date=new Date(
    event.date
  );

  const seats=getSeatsLeft(
    event
  );

  return (
    <article className="event-card">

      <div className="event-cover">

        <span>
          {event.category}
        </span>


        <div className="date-box">

          <b>
            {isNaN(date)
              ?""
              :date.getDate()
            }
          </b>

          <small>
            {isNaN(date)
              ?""
              :date
                .toLocaleString(
                  "en",
                  {month:"short"}
                )
                .toUpperCase()
            }
          </small>

        </div>

      </div>


      <div className="event-body">

        <div className="event-type">
          {event.type||"EVENT"}
        </div>


        <h3>
          {event.title}
        </h3>


        <p>
          {event.description}
        </p>


        <div className="meta">

          <span>

            <CalendarDays size={15}/>

            {isNaN(date)
              ?"TBA"
              :date.toLocaleDateString(
                "en-IN",
                {
                  day:"numeric",
                  month:"short",
                  year:"numeric"
                }
              )
            }

          </span>


          <span>

            <MapPin size={15}/>

            {event.location}

          </span>

        </div>


        <div className="card-bottom">

          <span
            className={
              seats<10
                ?"seats low"
                :"seats"
            }
          >

            <Users size={15}/>

            {seats} seats left

          </span>


          <button
            className="arrow-btn"
            onClick={()=>
              open(event)
            }
          >
            <ChevronRight/>
          </button>

        </div>

      </div>

    </article>
  );
}


/* =========================================================
   EVENT DETAIL
========================================================= */

function Detail({
  event,
  user,
  back,
  register,
  setToast
}){

  const [
    participants,
    setParticipants
  ]=useState([]);

  const [
    showParticipants,
    setShowParticipants
  ]=useState(false);

  const [
    participantsLoading,
    setParticipantsLoading
  ]=useState(false);


  async function loadParticipants(){

    setParticipantsLoading(
      true
    );

    try{

      const response=
        await api.get(
          `/registrations/event/${event._id}/participants`
        );

      setParticipants(
        response.data
          ?.participants||[]
      );

      setShowParticipants(
        true
      );

    }catch(error){

      console.error(
        "Failed to load participants",
        error
      );

      setToast(
        "Could not load participants"
      );

    }finally{

      setParticipantsLoading(
        false
      );

    }
  }


  if(!event){

    return (
      <div className="container empty-page">

        <h2>
          Select an event
        </h2>

        <button
          onClick={back}
        >
          Back
        </button>

      </div>
    );
  }


  const date=new Date(
    event.date
  );


  const seatsLeft=
    event.seatsLeft ??
    Math.max(
      Number(event.capacity||0) -
      Number(event.registeredCount||0),
      0
    );


  return (
    <main className="container detail-page">

      <button
        className="back-btn"
        onClick={back}
      >
        ← Back to events
      </button>


      <div className="detail-layout">

        <div className="detail-main">

          <div className="detail-banner">

            <span>
              {event.category}
            </span>

            <h1>
              {event.title}
            </h1>

          </div>


          <div className="detail-copy">

            <h2>
              About this event
            </h2>


            <p>
              {event.description}
            </p>


            <div className="info-grid">

              <Info
                icon={
                  <CalendarDays/>
                }
                title="Date"
                value={
                  isNaN(date)
                    ?"TBA"
                    :date.toLocaleDateString(
                      "en-IN",
                      {
                        dateStyle:"full"
                      }
                    )
                }
              />


              <Info
                icon={
                  <Clock3/>
                }
                title="Time"
                value={
                  event.time
                }
              />


              <Info
                icon={
                  <MapPin/>
                }
                title="Location"
                value={
                  event.location
                }
              />


              <Info
                icon={
                  <Users/>
                }
                title="Capacity"
                value={
                  `${event.registeredCount||0} / ${event.capacity} registered`
                }
              />

            </div>

          </div>

        </div>


        <aside className="detail-side">

          {/* ORGANIZER VIEW */}

          {user?.role==="organizer" ? (

            <div className="side-card">

              <div className="side-label">
                ORGANIZER VIEW
              </div>


              <h2>
                {event.registeredCount||0}
                {" "}
                participants
              </h2>


              <p>
                {seatsLeft}
                {" "}
                seats remaining
              </p>


              <button
                className="primary wide"
                onClick={
                  loadParticipants
                }
                disabled={
                  participantsLoading
                }
              >
                {participantsLoading
                  ?"Loading..."
                  :"View participants"
                }
              </button>


              {showParticipants&&(

                <div className="participants-list">

                  {participants.length>0 ? (

                    participants.map(
                      participant=>(

                        <div
                          className="participant-item"
                          key={
                            participant.registrationId ||
                            participant._id
                          }
                        >

                          <div>

                            <strong>
                              {
                                participant.student?.name ||
                                participant.name ||
                                "Unknown student"
                              }
                            </strong>


                            <p>
                              {
                                participant.student?.email ||
                                participant.email ||
                                "No email"
                              }
                            </p>

                          </div>


                          <span>
                            Registered
                          </span>

                        </div>

                      )
                    )

                  ): (

                    <p>
                      No participants registered yet.
                    </p>

                  )}

                </div>

              )}

            </div>

          ): (

            /* STUDENT / PUBLIC VIEW */

            <div className="side-card">

              <div className="side-label">
                REGISTRATION
              </div>


              <h2>
                {seatsLeft}
                {" "}
                seats available
              </h2>


              <p>
                Reserve your place before the event fills up.
              </p>


              <button
                className="primary wide"
                disabled={
                  !user ||
                  event.isRegistered ||
                  seatsLeft<=0
                }
                onClick={()=>
                  register(event)
                }
              >

                {!user

                  ?"Login to register"

                  :event.isRegistered

                    ?"✓ Registered"

                    :"Register now"

                }

              </button>

            </div>

          )}

        </aside>

      </div>

    </main>
  );
}


/* =========================================================
   INFO
========================================================= */

function Info({
  icon,
  title,
  value
}){

  return (
    <div className="info">

      <span>
        {icon}
      </span>


      <div>

        <small>
          {title}
        </small>

        <b>
          {value}
        </b>

      </div>

    </div>
  );
}


/* =========================================================
   AUTH
========================================================= */

function Auth({
  mode,
  setMode,
  onSuccess
}){

  const [form,setForm]=useState({

    name:"",
    email:"",
    password:"",
    role:"student"

  });


  const [
    busy,
    setBusy
  ]=useState(false);


  const [
    error,
    setError
  ]=useState("");


  async function submit(e){

    e.preventDefault();

    setBusy(true);
    setError("");


    try{

      const url=
        mode==="login"
          ?"/auth/login"
          :"/auth/register";


      const response=
        await api.post(
          url,
          form
        );


      onSuccess(
        response.data.user,
        response.data.token
      );

    }catch(error){

      setError(
        error.response
          ?.data
          ?.message||
        "Something went wrong"
      );

    }finally{

      setBusy(false);

    }
  }


  return (
    <main className="auth-page">

      <div className="auth-card">

        <div className="auth-head">

          <span className="brand-mark large">
            <Sparkles/>
          </span>


          <h1>

            {mode==="login"
              ?"Welcome back"
              :"Create your account"
            }

          </h1>


          <p>

            {mode==="login"
              ?"Sign in to manage your event experience."
              :"Join EventHub and start discovering events."
            }

          </p>

        </div>


        <form
          onSubmit={submit}
        >

          {mode==="register"&&(

            <input
              required
              placeholder="Full name"
              value={form.name}
              onChange={e=>
                setForm({
                  ...form,
                  name:e.target.value
                })
              }
            />

          )}


          <input
            required
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={e=>
              setForm({
                ...form,
                email:e.target.value
              })
            }
          />


          <input
            required
            minLength="6"
            type="password"
            placeholder="Password (6+ characters)"
            value={form.password}
            onChange={e=>
              setForm({
                ...form,
                password:e.target.value
              })
            }
          />


          {mode==="register"&&(

            <select
              value={form.role}
              onChange={e=>
                setForm({
                  ...form,
                  role:e.target.value
                })
              }
            >

              <option value="student">
                Student / Attendee
              </option>

              <option value="organizer">
                Event Organizer
              </option>

            </select>

          )}


          {error&&(

            <div className="form-error">
              {error}
            </div>

          )}


          <button
            className="primary wide"
            disabled={busy}
          >

            {busy
              ?"Please wait..."
              :mode==="login"
                ?"Sign in"
                :"Create account"
            }

          </button>

        </form>


        <button
          className="switch"
          onClick={()=>{

            setMode(
              mode==="login"
                ?"register"
                :"login"
            );

            setError("");

          }}
        >

          {mode==="login"
            ?"New here? Create an account"
            :"Already have an account? Sign in"
          }

        </button>

      </div>

    </main>
  );
}


/* =========================================================
   CREATE EVENT
========================================================= */

function Create({
  onDone
}){

  const [form,setForm]=useState({

    title:"",
    description:"",
    category:"Technology",
    type:"Workshop",
    date:"",
    time:"",
    location:"",
    capacity:50

  });


  const [
    error,
    setError
  ]=useState("");


  function change(
    key,
    value
  ){

    setForm(prev=>({

      ...prev,

      [key]:value

    }));

  }


  async function submit(e){

    e.preventDefault();

    setError("");


    try{

      await api.post(
        "/events",
        {
          ...form,
          capacity:Number(
            form.capacity
          )
        }
      );


      onDone();

    }catch(error){

      setError(
        error.response
          ?.data
          ?.message||
        "Could not create event"
      );

    }

  }


  return (
    <main className="container form-page">

      <div className="page-title">

        <span className="eyebrow small">
          ORGANIZER
        </span>

        <h1>
          Create an event
        </h1>

        <p>
          Publish an event for your community to discover and register.
        </p>

      </div>


      <form
        className="event-form"
        onSubmit={submit}
      >

        <div className="form-row">

          <label>

            Event title

            <input
              required
              value={form.title}
              onChange={e=>
                change(
                  "title",
                  e.target.value
                )
              }
            />

          </label>


          <label>

            Category

            <select
              value={form.category}
              onChange={e=>
                change(
                  "category",
                  e.target.value
                )
              }
            >

              {categories
                .slice(1)
                .map(categoryName=>(

                  <option
                    key={categoryName}
                  >
                    {categoryName}
                  </option>

                ))

              }

            </select>

          </label>

        </div>


        <label>

          Description

          <textarea
            required
            rows="4"
            value={form.description}
            onChange={e=>
              change(
                "description",
                e.target.value
              )
            }
          />

        </label>


        <div className="form-row">

          <label>

            Event type

            <input
              value={form.type}
              onChange={e=>
                change(
                  "type",
                  e.target.value
                )
              }
            />

          </label>


          <label>

            Location

            <input
              required
              value={form.location}
              onChange={e=>
                change(
                  "location",
                  e.target.value
                )
              }
            />

          </label>

        </div>


        <div className="form-row three">

          <label>

            Date

            <input
              required
              type="date"
              value={form.date}
              onChange={e=>
                change(
                  "date",
                  e.target.value
                )
              }
            />

          </label>


          <label>

            Time

            <input
              required
              value={form.time}
              onChange={e=>
                change(
                  "time",
                  e.target.value
                )
              }
            />

          </label>


          <label>

            Capacity

            <input
              required
              min="1"
              type="number"
              value={form.capacity}
              onChange={e=>
                change(
                  "capacity",
                  e.target.value
                )
              }
            />

          </label>

        </div>


        {error&&(

          <div className="form-error">
            {error}
          </div>

        )}


        <button
          className="primary"
          type="submit"
        >

          <Plus size={18}/>

          Publish event

        </button>

      </form>

    </main>
  );
}


/* =========================================================
   ORGANIZER DASHBOARD
========================================================= */

function Dashboard({user,go}){

  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(true);

  async function loadOrganizerEvents(){

    setLoading(true);

    try{

      const r=await api.get("/events/organizer/my");

      console.log("Organizer events:",r.data);

      setEvents(r.data.events || []);

    }catch(e){

      console.error(
        "Failed to load organizer events:",
        e.response?.data || e.message
      );

      setEvents([]);

    }finally{

      setLoading(false);

    }
  }

  useEffect(()=>{
    if(user?.role==="organizer"){
      loadOrganizerEvents();
    }else{
      setLoading(false);
    }
  },[user]);

  return (

    <main className="container dashboard">

      <div className="page-title">

        <span className="eyebrow small">
          DASHBOARD
        </span>

        <h1>
          Hello, {user?.name?.split(" ")[0]}.
        </h1>

        <p>
          Here is your EventHub activity at a glance.
        </p>

      </div>


      <div className="stats">

        <Stat
          label="Your role"
          value={user?.role}
        />

        <Stat
          label="Events managed"
          value={
            user?.role==="organizer"
              ? events.length
              : "—"
          }
        />

        <Stat
          label="Platform"
          value="EventHub"
        />

      </div>


      {user?.role==="organizer" ? (

        <>

          <div className="section-head">

            <h2>
              Your events
            </h2>

            <button
              className="primary"
              onClick={()=>go("create")}
            >

              <Plus size={16}/>

              Create event

            </button>

          </div>


          <div className="mini-list">

            {loading ? (

              <div className="loading">
                Loading your events...
              </div>

            ) : events.length > 0 ? (

              events.map(event => (

                <div
                  className="mini-event"
                  key={event._id}
                >

                  <div>

                    <b>
                      {event.title}
                    </b>

                    <span>
                      {event.location} ·{" "}
                      {event.registeredCount || 0}/
                      {event.capacity} registered
                    </span>

                  </div>

                  <ChevronRight/>

                </div>

              ))

            ) : (

              <div className="empty">

                <p>
                  No events yet.
                </p>

                <button
                  className="primary"
                  onClick={()=>go("create")}
                >
                  <Plus size={16}/>
                  Create your first event
                </button>

              </div>

            )}

          </div>

        </>

      ) : (

        <div className="callout">

          <Ticket/>

          <div>

            <b>
              Ready to explore?
            </b>

            <p>
              Discover upcoming events and reserve your seat.
            </p>

          </div>

          <button
            onClick={()=>go("home")}
          >
            Browse events
          </button>

        </div>

      )}

    </main>

  );
}


function Stat({label,value}){

  return (

    <div className="stat">

      <span>
        {label}
      </span>

      <b>
        {value}
      </b>

    </div>

  );

}


/* =========================================================
   EDIT EVENT
========================================================= */

function EditEvent({
  event,
  saving,
  onClose,
  onSave
}){

  const [
    form,
    setForm
  ]=useState({

    title:event.title||"",

    description:
      event.description||"",

    category:
      event.category||
      "Technology",

    type:
      event.type||
      "Workshop",

    date:event.date
      ?event.date.slice(0,10)
      :"",

    time:event.time||"",

    location:
      event.location||"",

    capacity:
      event.capacity||50

  });


  function change(
    key,
    value
  ){

    setForm(prev=>({

      ...prev,

      [key]:value

    }));

  }


  function submit(e){

    e.preventDefault();

    onSave({
      ...form,
      capacity:Number(
        form.capacity
      )
    });

  }


  return (
    <div className="modal-overlay">

      <div className="modal-card">

        <div className="modal-head">

          <div>

            <span className="eyebrow small">
              ORGANIZER
            </span>

            <h2>
              Edit Event
            </h2>

          </div>


          <button
            className="icon-btn"
            onClick={onClose}
            type="button"
          >
            <X size={20}/>
          </button>

        </div>


        <form
          className="event-form"
          onSubmit={submit}
        >

          <label>

            Event title

            <input
              required
              value={form.title}
              onChange={e=>
                change(
                  "title",
                  e.target.value
                )
              }
            />

          </label>


          <label>

            Description

            <textarea
              required
              rows="4"
              value={form.description}
              onChange={e=>
                change(
                  "description",
                  e.target.value
                )
              }
            />

          </label>


          <div className="form-row">

            <label>

              Category

              <select
                value={form.category}
                onChange={e=>
                  change(
                    "category",
                    e.target.value
                  )
                }
              >

                {categories
                  .slice(1)
                  .map(categoryName=>(

                    <option
                      key={categoryName}
                    >
                      {categoryName}
                    </option>

                  ))

                }

              </select>

            </label>


            <label>

              Event type

              <input
                value={form.type}
                onChange={e=>
                  change(
                    "type",
                    e.target.value
                  )
                }
              />

            </label>

          </div>


          <div className="form-row">

            <label>

              Date

              <input
                required
                type="date"
                value={form.date}
                onChange={e=>
                  change(
                    "date",
                    e.target.value
                  )
                }
              />

            </label>


            <label>

              Time

              <input
                required
                value={form.time}
                onChange={e=>
                  change(
                    "time",
                    e.target.value
                  )
                }
              />

            </label>

          </div>


          <div className="form-row">

            <label>

              Location

              <input
                required
                value={form.location}
                onChange={e=>
                  change(
                    "location",
                    e.target.value
                  )
                }
              />

            </label>


            <label>

              Capacity

              <input
                required
                min="1"
                type="number"
                value={form.capacity}
                onChange={e=>
                  change(
                    "capacity",
                    e.target.value
                  )
                }
              />

            </label>

          </div>


          <div className="modal-actions">

            <button
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>


            <button
              className="primary"
              disabled={saving}
            >

              {saving
                ?"Saving..."
                :"Save Changes"
              }

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


/* =========================================================
   STUDENT REGISTRATIONS
========================================================= */

function Tickets(){

  const [
    items,
    setItems
  ]=useState([]);

  const [
    loading,
    setLoading
  ]=useState(true);


  async function load(){

    setLoading(true);

    try{

      const response=
        await api.get(
          "/registrations/mine"
        );


      const data=
        Array.isArray(response.data)
          ?response.data
          :(response.data.registrations||[]);


      setItems(data);

    }catch(error){

      console.error(
        "Failed to load registrations",
        error
      );

    }finally{

      setLoading(false);

    }

  }


  useEffect(()=>{

    load();

  },[]);


  async function cancelRegistration(
    eventId
  ){

    if(
      !window.confirm(
        "Cancel your registration for this event?"
      )
    ){

      return;

    }


    try{

      await api.delete(
        `/registrations/${eventId}`
      );


      setItems(prev=>
        prev.map(registration=>{

          const registrationEventId=
            typeof registration.event===
            "object"
              ?registration.event?._id
              :registration.event;


          return registrationEventId===
            eventId

            ?{
                ...registration,
                status:"cancelled"
              }

            :registration;

        })
      );

    }catch(error){

      alert(
        error.response
          ?.data
          ?.message||
        "Could not cancel registration"
      );

    }

  }


  return (
    <main className="container">

      <div className="page-title">

        <span className="eyebrow small">
          MY EVENTS
        </span>

        <h1>
          Your registrations
        </h1>

        <p>
          Keep track of the events you have reserved.
        </p>

      </div>


      {loading ? (

        <div className="loading">
          Loading registrations...
        </div>

      ):items.length ? (

        <div className="ticket-list">

          {items.map(registration=>{

            const event=
              registration.event;

            const cancelled=
              registration.status===
              "cancelled";


            return (

              <div
                className="ticket"
                key={
                  registration._id
                }
              >

                <div>

                  <span className="event-type">
                    {event?.category}
                  </span>


                  <h3>
                    {event?.title||
                      "Event"
                    }
                  </h3>


                  <p>

                    <CalendarDays size={15}/>

                    {event?.date

                      ?new Date(
                        event.date
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          dateStyle:"medium"
                        }
                      )

                      :"TBA"

                    }

                    {" · "}

                    {event?.location}

                  </p>

                </div>


                <div className="ticket-actions">

                  <span
                    className={
                      cancelled
                        ?"status cancelled"
                        :"status"
                    }
                  >

                    {cancelled
                      ?"CANCELLED"
                      :"REGISTERED"
                    }

                  </span>


                  {!cancelled&&(

                    <button
                      className="icon-danger"
                      title="Cancel registration"
                      onClick={()=>
                        cancelRegistration(
                          event?._id||
                          registration.event
                        )
                      }
                    >
                      <Trash2 size={17}/>
                    </button>

                  )}

                </div>

              </div>

            );

          })}

        </div>

      ): (

        <div className="empty">
          No registrations yet. Explore events to get started.
        </div>

      )}

    </main>
  );
}


/* =========================================================
   ADMIN
========================================================= */

function Admin(){

  const [
    stats,
    setStats
  ]=useState({

    users:0,
    events:0,
    registrations:0

  });


  const [
    events,
    setEvents
  ]=useState([]);


  const [
    loading,
    setLoading
  ]=useState(true);


  async function loadAdmin(){

    setLoading(true);

    try{

      const [
        statsResponse,
        eventsResponse
      ]=await Promise.all([

        api.get(
          "/admin/stats"
        ),

        api.get(
          "/events"
        )

      ]);


      const statsData=
        statsResponse.data
          ?.stats||
        statsResponse.data||
        {};


      setStats({

        users:
          statsData.totalUsers||
          statsData.users||
          0,

        events:
          statsData.totalEvents||
          statsData.events||
          0,

        registrations:
          statsData.totalRegistrations||
          statsData.registrations||
          0

      });


      const data=
        Array.isArray(
          eventsResponse.data
        )
          ?eventsResponse.data
          :(eventsResponse.data.events||[]);


      setEvents(
        data.map(normalizeEvent)
      );

    }catch(error){

      console.error(
        "Failed to load admin data",
        error
      );

    }finally{

      setLoading(false);

    }

  }


  useEffect(()=>{

    loadAdmin();

  },[]);


  async function remove(
    eventId
  ){

    if(
      !window.confirm(
        "Remove this event from EventHub?"
      )
    ){

      return;

    }


    try{

      await api.delete(
        `/admin/events/${eventId}`
      );


      setEvents(prev=>
        prev.filter(
          event=>
            event._id!==eventId
        )
      );


      setStats(prev=>({

        ...prev,

        events:Math.max(
          Number(prev.events)-1,
          0
        )

      }));

    }catch(error){

      alert(
        error.response
          ?.data
          ?.message||
        "Could not remove event"
      );

    }

  }


  return (
    <main className="container dashboard">

      <div className="page-title">

        <span className="eyebrow small">
          ADMIN CONTROL
        </span>


        <h1>
          Platform overview
        </h1>


        <p>
          Monitor users, events and registrations.
        </p>

      </div>


      <div className="stats">

        <Stat
          label="Total Users"
          value={stats.users}
        />


        <Stat
          label="Total Events"
          value={stats.events}
        />


        <Stat
          label="Registrations"
          value={stats.registrations}
        />

      </div>


      <div className="section-head">

        <div>

          <span className="eyebrow small">
            PLATFORM MANAGEMENT
          </span>

          <h2>
            All Events
          </h2>

        </div>

      </div>


      {loading ? (

        <div className="loading">
          Loading platform data...
        </div>

      ):events.length ? (

        <div className="mini-list">

          {events.map(event=>(

            <div
              className="mini-event"
              key={event._id}
            >

              <div>

                <b>
                  {event.title}
                </b>


                <span>
                  {event.organizer?.name||
                    "Organizer"
                  }

                  {" · "}

                  {event.category}

                </span>


                <span>
                  {event.registeredCount||0}
                  {" / "}
                  {event.capacity}
                  {" registered"}
                </span>

              </div>


              <button
                className="icon-danger"
                title="Delete event"
                onClick={()=>
                  remove(
                    event._id
                  )
                }
              >
                <Trash2 size={17}/>
              </button>

            </div>

          ))}

        </div>

      ): (

        <div className="empty">
          No events available.
        </div>

      )}

    </main>
  );
}


/* =========================================================
   ROOT
========================================================= */

function Root(){

  return <App/>;

}


createRoot(
  document.getElementById("root")
).render(

  <BrowserRouter>

    <Root/>

  </BrowserRouter>

);