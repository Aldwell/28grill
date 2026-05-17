// This is a demo of a preview
'use client'
import { Component } from "@/components/ui/3d-book-testimonial";

const DemoOne = () => {
  const testimonials = [
    {
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      text: 'This component library is incredibly versatile. It saved me hours of development time.',
      name: 'Ethan Smith',
      jobtitle: 'Software Engineer',
      rating: 5,
    },
    {
      image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      text: 'The seamless integration and intuitive design of these components are truly impressive.',
      name: 'Olivia Chen',
      jobtitle: 'Product Manager',
      rating: 4,
    },
    {
      image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      text: 'As a UX designer, I appreciate the attention to detail. The components are well-crafted.',
      name: 'Liam Johnson',
      jobtitle: 'UX Designer',
      rating: 5,
    },
    {
      image: 'https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      text: 'This library is a game-changer for our marketing efforts. It has significantly boosted our conversion rates!',
      name: 'Ava Martinez',
      jobtitle: 'Marketing Specialist',
      rating: 5,
    },
    {
      image: 'https://images.unsplash.com/photo-1507003211169-0a6dd7228f2d?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8fHx8fA%3D%3D',
      text: 'Developing with these components is a breeze. The documentation is clear and helpful.',
      name: 'Noah Williams',
      jobtitle: 'Full Stack Developer',
      rating: 4,
    },
    {
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      text: 'The components are fantastic! They make our content more dynamic and engaging. Highly recommend it.',
      name: 'Sophia Brown',
      jobtitle: 'Content Creator',
      rating: 5,
    },
    {
      image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      text: 'As a startup, efficiency is key. This component library provides high-quality, ready-to-use solutions.',
      name: 'James Davis',
      jobtitle: 'Startup Founder',
      rating: 5,
    },
    {
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      text: 'Solid components and excellent performance. They integrate smoothly and provide a rich user experience.',
      name: 'Benjamin Miller',
      jobtitle: 'Backend Engineer',
      rating: 4,
    },
  ];

  return (
    <div className="flex w-full h-screen justify-center items-center">
      <Component testimonials={testimonials} />
    </div>
  );
};

export default DemoOne;
