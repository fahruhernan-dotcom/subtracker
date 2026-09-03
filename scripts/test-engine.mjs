import { differenceInCalendarDays, parseISO } from 'date-fns';

function resolveSubscriptionStatus(sub, currentDate = new Date()) {
  if (sub.status === 'TERMINATED') {
    return 'TERMINATED';
  }
  const daysLeft = differenceInCalendarDays(parseISO(sub.endDate), currentDate);
  const hasUncompleted = sub.checklist.some(i => !i.completed);

  if (daysLeft < 0) return 'ACTION_REQUIRED';
  if (daysLeft === 0) return hasUncompleted ? 'ACTION_REQUIRED' : 'EXPIRED';
  if (daysLeft <= 7) return 'EXPIRING_SOON';
  return 'ACTIVE';
}

function runTests() {
  console.log("🚀 Running SubTracker Admin State Engine Tests...\n");
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
    }
  }

  // Test 1: Future member > 7 days is ACTIVE
  const futureSub = {
    memberName: 'Dimas Prasetyo',
    endDate: '2026-10-01',
    status: 'ACTIVE',
    checklist: [{ completed: false }]
  };
  assert(
    resolveSubscriptionStatus(futureSub, parseISO('2026-09-01')) === 'ACTIVE',
    'Member with 30 days remaining is ACTIVE'
  );

  // Test 2: Member with 7 days remaining is EXPIRING_SOON
  const soonSub = {
    memberName: 'Sarah Kartika',
    endDate: '2026-09-08',
    status: 'ACTIVE',
    checklist: [{ completed: false }]
  };
  assert(
    resolveSubscriptionStatus(soonSub, parseISO('2026-09-01')) === 'EXPIRING_SOON',
    'Member with 7 days remaining is EXPIRING_SOON'
  );

  // Test 3: Member due today with pending kick checklist is ACTION_REQUIRED
  const todaySub = {
    memberName: 'Budi Santoso',
    endDate: '2026-09-01',
    status: 'ACTIVE',
    checklist: [{ completed: false }]
  };
  assert(
    resolveSubscriptionStatus(todaySub, parseISO('2026-09-01')) === 'ACTION_REQUIRED',
    'Member expiring today with pending kick checklist is ACTION_REQUIRED'
  );

  // Test 4: Member past due date is ACTION_REQUIRED
  const overdueSub = {
    memberName: 'Reza Video',
    endDate: '2026-08-30',
    status: 'ACTIVE',
    checklist: [{ completed: false }]
  };
  assert(
    resolveSubscriptionStatus(overdueSub, parseISO('2026-09-01')) === 'ACTION_REQUIRED',
    'Member past due date is ACTION_REQUIRED'
  );

  // Test 5: Terminated / Kicked member remains TERMINATED
  const termSub = {
    memberName: 'Rudi Hartono (Ex-Member)',
    endDate: '2026-08-01',
    status: 'TERMINATED',
    checklist: [{ completed: true }]
  };
  assert(
    resolveSubscriptionStatus(termSub, parseISO('2026-09-01')) === 'TERMINATED',
    'Kicked member stays TERMINATED'
  );

  console.log(`\n🎉 Test Results: ${passed}/${total} passed`);
  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
