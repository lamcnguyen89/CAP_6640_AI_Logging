.. raw:: html

   <style>
     .logo-container {
       display: flex;
       justify-content: space-between;  /* Spreads the logos apart */
       align-items: center;
       margin-bottom: 20px;
     }

     .vera-logo {
       width: 150px;
     }

     .nsf-logo {
       width: 100px;
     }

     /* Responsive design */
     @media (max-width: 768px) {
       .logo-container {
         flex-direction: column;
       }

       .vera-logo, .nsf-logo {
         margin-bottom: 10px;
       }
     }
   </style>

   <div class="logo-container">
      <img src="_static/vera_logo.png" alt="VERA Logo" class="vera-logo">
      <img src="_static/nsf_logo.png" alt="NSF Logo" class="nsf-logo">
   </div>

Welcome to the VERA Documentation
=================================

The Virtual Experience Research Accelerator (VERA) project is designed to advance human-machine systems for conducting human subjects
research in the field of Extended Reality (XR), including Virtual Reality (VR) and Augmented Reality (AR).

**Mission**: To serve the community of XR researchers by providing tools to accelerate and improve the quality of their human subjects research,
building and sustaining a collaborative community of XR researchers, and fostering the next generation of XR researchers.

Table of Contents
------------------

Below is a table of contents for the VERA documentation.

It is recommended to start with the **Getting Started** section, which provides an overview of VERA, as well as installation and setup instructions.
Then, you can explore the **Core Functionality** section to learn about the main features of VERA, such as data logging, the web interface, and experiment management. 
Finally, the **Advanced Features** section covers more specialized topics like WebXR support, accessibility integration, multi-site collaboration, and working with collaborators.

Getting Started
~~~~~~~~~~~~~~~
.. toctree::
   :maxdepth: 2

   sections/overview
   sections/creed
   sections/quickstart
   sections/installation
   sections/setup
   sections/demo

Core Functionality
~~~~~~~~~~~~~~~~~~
.. toctree::
   :maxdepth: 2

   sections/unity_overview
   sections/logging_data
   sections/web_overview
   sections/experiments
   sections/data_management

Advanced Features
~~~~~~~~~~~~~~~~~
.. toctree::
   :maxdepth: 2

   sections/webxr
   sections/vlat
   sections/multi-site
   sections/collaborators
