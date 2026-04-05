Web Portal: Overview
=====================

The VERA suite of tools is divided into two primary components: the *VERA web portal* and the *VERA Unity plugin*. 
This section will guide you through an overview of the **VERA web portal** and its various components.

This section will examine a few major concepts:

1. **Web Portal Overview**: An overview of the VERA web portal, including its features and how it integrates with the VERA Unity plugin.
2. **Logging In**: Instructions on how to create an account, log in, and set up your profile in the VERA web portal.
3. **Pages and Navigation**: Understand the various pages in the VERA web portal, including the dashboard, experiment management, and data viewing.
4. **Next Steps**: Guidance on where to go next in the documentation to learn more about using the VERA web portal.

This documentation section does not cover in-depth explanations of how to create / manage experiments or view / download data.
For more details on these topics, see the `Managing Experiments <experiments.html>`_ section and the `Managing Data <data_management.html>`_ section respectively.

Web Portal Overview
--------------------

The VERA web portal is a web-based interface that allows researchers to manage their experiments, view data, and interact with the VERA platform.
The web portal primarily serves as a hub for managing the following aspects of your XR experiments:

- **Experiments**: Each experiment represents a single research study or project. You can create multiple experiments, each with its own set of file types and participant sessions.
- **File Types**: Each experiment can define multiple file types, which represent different data formats to log during the experiment. These file types can be CSV files, JSON files, or other formats as needed.
- **Participant Sessions**: Each experiment can have multiple participant sessions, which represent individual participants in the experiment. Each participant session can have its own set of logged data.
- **Storage**: The VERA web portal provides storage for the logged data, allowing you to view and analyze the data collected during your experiments.
- **Hosting Experiments**: The VERA web portal hosts your experiments (in WebXR format), allowing participants to interface with the experiment directly through their own personal web browser.

The web portal directly interacts with the VERA Unity plugin. This Unity plugin is what allows you to design and develop your XR experiments in Unity.
For more details on this plugin and its usage, see the `Unity Plugin: Overview <unity_overview.html>`_ section.

Logging In
---------------

1. Enter the following link into your web browser:

   - `https://sreal.ucf.edu/vera-portal/ <https://sreal.ucf.edu/vera-portal/>`_

   .. image:: /_static/WebPortal.png
      :alt: The VERA web portal
      :width: 400px
      :align: center

2. Create your account with VERA. Click the **Sign Up** button, and enter your information. You will need to verify your email address before you can log in.

   .. image:: /_static/SignUp.png
      :alt: The VERA Sign-Up page
      :width: 300px
      :align: center

3. Once you have verified your email, you will be prompted to set up your account. Here, you can define your name, institution, and other relevant information.

   .. image:: /_static/AccountSetup.png
      :alt: The VERA Account Setup page
      :width: 300px
      :align: center

4. After setting up your account, you will be redirected to the dashboard. This is where your experiments will be listed. Your account should be created with a simple demo experiment.

   .. image:: /_static/Dashboard.png
      :alt: The VERA Dashboard
      :width: 400px
      :align: center

Pages and Navigation
----------------------

The VERA web portal consists of several key pages that allow you to manage your experiments and view data. Here are the main pages you will encounter:

- **Dashboard**: The main page where you can see all your experiments. From here, you can create new experiments and manage existing ones.

   .. image:: /_static/Dashboard.png
      :alt: The VERA Dashboard
      :width: 400px
      :align: center

- **Experiment Creation / Experiment Details**: This page allows you to create a new experiment or edit an existing one. From the dashboard, click the **Create New Experiment** button to start a new experiment, or click the **Edit Experiment** button for an existing experiment. Here, you can define an experiment's metadata, file types, collaborators, and WebXR information.

   .. image:: /_static/ExperimentCreationPage.png
      :alt: The VERA Experiment Creation Page
      :width: 400px
      :align: center

- **Experiment Results**: This page allows you to view the results of your experiments. You can see the logged data, download files, and manage participant sessions. From the dashboard, click on the name of a particular experiment to reach its results page.

   .. image:: /_static/ExperimentResults.png
      :alt: The VERA Experiment Results Page
      :width: 400px
      :align: center

- **Participant Results**: This page shows the particular results and associated files for a specific participant session. You can view the logged data, download files, and manage the participant session. From the experiment results page, click on the **View** button for a particular participant.

   .. image:: /_static/ParticipantResults.png
      :alt: The VERA Participant Results Page
      :width: 400px
      :align: center

- **Account Settings**: This page allows you to manage your account settings, including your profile information, password, and institutional affiliation. You can access this page by clicking on the profile icon in the top right corner of the web portal.

   .. image:: /_static/AccountSettings.png
      :alt: The VERA Account Settings Page
      :width: 400px
      :align: center

Next Steps
-----------

For more details on specific features of the VERA web portal, refer to the following sections:

   - `Experiment Management <experiments.html>`_: This section provides an in-depth guide on creating and managing experiments, including how to define file types and collaborators.
   - `Managing Data <data_management.html>`_: This section provides a guide on how to view, download, and manage the data collected during your experiments.
   - `Multi-Site Management <multi-site.html>`_: This section provides a guide on how to manage your multi-site experiments, including how to set up and manage multiple sites within the VERA web portal.

For more details on the VERA Unity plugin and how to build your experiments from Unity, you can refer to the `Unity Plugin: Overview <unity_overview.html>`_ section.

If you'd like to see a concrete demonstration of the VERA web portal in action, you can refer to the `Demo <demo.html>`_ section.