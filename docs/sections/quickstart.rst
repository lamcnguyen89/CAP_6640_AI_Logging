Quickstart
==========

The VERA suite of tools are split among two primary components: the VERA *web client* and the VERA *Unity plugin*. This quickstart guide will help you set up VERA for your XR experiments, split into the following steps:

1. **Installation**: Install the VERA Unity plugin and set up your Unity project.
2. **Setup**: Configure your Unity project to work with VERA.
3. **Demo**: Run a demo scene to test your setup.
4. **Next Steps**: Explore further documentation for more details on using VERA.

This quickstart guide only provides a high-level overview of the steps to get started with VERA.
Each step is explained in more detail in corresponding dedicated documentation sections relating to the topic.
Links to these dedicated sections are provided in each step of the quickstart guide.

Quick Installation
-------------------

To use VERA, you need to install **Unity**, as well as the **VERA Unity package**. The following steps will guide you through this installation process, assuming you are starting from scratch.

For a more detailed guide, refer to the `Installation <installation.html>`_ section.

1. **Install Unity**: Download and install **Unity Hub** from the `Unity Download Page <https://unity.com/download>`_. 
   Open Unity Hub and install any version of Unity. VERA supports Unity versions **(2022.3.34f1)** or later. 
   (`Unity Installation Guide <https://docs.unity3d.com/Manual/GettingStartedInstallingUnity.html>`_)

2. **Open a Unity Project**: In Unity Hub, create a new 3D project or open an existing one. 
   (`Unity Guide on New Projects <https://docs.unity3d.com/hub/manual/AddProject.html>`_)
   
3. **Install the VERA Unity Plugin**: Download the **VERA Unity plugin**: `VERA Unity Plugin (Version 0.1.0) <https://sreal.ucf.edu/vera-portal/static/VERA-Unity-plugin-0.1.0.unitypackage>`_. 
   Import the package into Unity. (`Unity Manual on Importing Packages <https://docs.unity3d.com/Manual/AssetPackagesImport.html>`_)

4. **Ensure Proper Import**: VERA is now installed into your Unity project. A **VERA** folder should be in your `Packages` directory. 
   The **XR Interaction Toolkit**, **VR Package**, and **TextMeshPro (TMP) Essential Resources** should be automatically installed as dependencies.

Quick Setup
------------

In order for your Unity experiments to properly communicate with the VERA portal, you need to set up your Unity project with the VERA plugin.

For a more detailed guide, refer to the `Setup <setup.html>`_ section.

1. **Log In to the VERA Portal**: In a web browser, navigate to the `VERA Portal <https://sreal.ucf.edu/vera-portal/>`_.
   Sign up for a new account, or log in with your credentials.

2. **Prepare Your Unity Project**: Open your Unity project and ensure all necessary dependencies are installed (as outlined in the `Installation <installation.html>`_ section).

3. **Authenticate Your Unity Project**: In the Unity menu bar, find the **VERA** tab and select **Settings**.
   In the newly opened **VERA Settings** window, click **Authenticate**. This will open a web browser to the VERA portal, linking your Unity project to your VERA account.

4. **Ensure You are Logged In**: Return to Unity and ensure the **VERA Settings** window shows your account information.

Quick Demo
-----------

To test your setup, you can run a demo scene that logs data to the VERA portal.

For a more detailed guide, refer to the `Demo <demo.html>`_ section.

1. **Open the Demo Scene**: Inside your Unity project, navigate to `Packages` > `VERA` > `Runtime` > `Samples` and open the scene named `DemoScene`.

2. **Select the Demo Experiment**: In the **VERA Settings** window, select your active experiment from the dropdown menu. 
   This is the experiment to which the demo will log data. If you do not have a default demo experiment, you can create one in the VERA portal. 
   See the `Demo <demo.html>`_ section for more details on creating this demo experiment.

3. **Run the Demo**: Play the scene in Unity. The demo will log data to the VERA portal, demonstrating how to use the VERA Logger and file types.

4. **View the Logs**: After running the demo, you can view the logged data in the VERA portal. From the home dashboard, select your demo experiment.
   You should see a newly recorded participant session. Click the **View** button to see the logged data.

5. **Explore the Demo Scene**: The demo scene includes various demonstrative scripts which show how to log data using the VERA Logger.
   You can modify these scripts to suit your own experiments or use them as a reference for your own logging needs. 
   For more details on these demo components, see the `Demo <demo.html>`_ section.

Next Steps
----------

After completing the Quickstart guide:

- Explore the `Unity Plugin: Overview <unity_overview.html>`_ section for more details on how to use the VERA Unity plugin.
- Explore the `Web Portal: Overview <web_overview.html>`_ section for more details on how to use the VERA web portal.

Return to the `Documentation Home <../index.html>`_ for a summary of the documentation and how to navigate it.
Also see the `Overview <overview.html>`_ section for a high-level understanding of VERA's features and capabilities.
