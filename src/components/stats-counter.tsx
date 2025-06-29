"use client";

import CountUp from 'react-countup';

interface StatsCounterProps {
  value: number;
}

export default function StatsCounter({ value }: StatsCounterProps) {
  return (
    <CountUp
      end={value}
      duration={2.5}
      separator=","
      enableScrollSpy={true}
      scrollSpyDelay={200}
    >
      {({ countUpRef }) => <span ref={countUpRef} />}
    </CountUp>
  );
}
