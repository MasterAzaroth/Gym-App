import { PageTitle, Empty, Stub } from '../components/ui'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export default function Progress() {
  return (
    <>
      <PageTitle eyebrow="Over time">Progress</PageTitle>

      <Empty
        title="Nothing logged yet"
        body="Charts appear once you've finished a session. Two sessions gives you a trend."
        action={<Link to="/train"><Button>Log your first session</Button></Link>}
      />

      <Stub note="Next build: estimated 1RM per lift over time, weekly volume by muscle group, bodyweight trend." />
    </>
  )
}
