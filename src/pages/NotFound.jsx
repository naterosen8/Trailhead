import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="wrap page notfound">
      <div className="tag">404</div>
      <h1>This trail doesn't go anywhere.</h1>
      <p className="sec-note">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary notfound-cta">
        Back to Trailhead
      </Link>
    </section>
  )
}
