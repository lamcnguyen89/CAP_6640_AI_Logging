Unity Plugin: Overview
========================

The VERA suite of tools is divided into two primary components: the *VERA web portal* and the *VERA Unity plugin*. 
This section will guide you through an overview of the **VERA Unity plugin** and its various components.

This section will examine a few major concepts:

1. **Plugin Overview**: An overview of the VERA Unity plugin, including its features and how it integrates with the VERA web portal.
2. **Getting Started**: A quick guide to set up and run a demo scene using the VERA Unity plugin.
3. **Using the VERA Settings Window**: How to access and use the VERA Settings window to manage your connection to the VERA portal and configure your experiments.
4. **Next Steps**: Guidance on where to go next in the documentation to learn more about using the VERA Unity plugin.

This documentation section does not cover in-depth explanations of how to log data in Unity, how to build experiments for WebXR, or how to use the VERA Locomotion Accessibility Toolkit (VLAT).
For more details on these topics, see the `Logging Data <logging_data.html>`_ section, the `WebXR Guide <webxr.html>`_ section, and the `VLAT <vlat.html>`_ section respectively.

Plugin Overview
-----------------

At a high level, the VERA Unity plugin is designed to aid in data collection during an active XR experiment.
It aims to provide a simple and extensible interface for this data collection, which can be used to log data in a variety of custom formats.

The plugin accomplishes this by interfacing directly with the VERA web portal. Of note to the plugin, the *web portal* is designed to handle the following components:

- **Experiments**: Each experiment represents a single research study or project. You can create multiple experiments, each with its own set of file types and participant sessions.
- **File Types**: Each experiment can define multiple file types, which represent different data formats to log during the experiment. These file types can be CSV files, JSON files, or other formats as needed.
- **Participant Sessions**: Each experiment can have multiple participant sessions, which represent individual participants in the experiment. Each participant session can have its own set of logged data.
- **Storage**: The VERA web portal provides storage for the logged data, allowing you to view and analyze the data collected during your experiments.
- **Hosting Experiments**: The VERA web portal hosts your experiments (in WebXR format), allowing participants to interface with the experiment directly through their own personal web browser.

The Unity plugin is designed to work seamlessly with the VERA web portal, allowing you to log data during your XR experiments and submit it to the portal for later analysis.
As such, consider the web portal as the primary interface for managing your experiments, defining file types, and viewing logged data, 
while the Unity plugin is the tool used to design your experiments, and log data during the experiments themselves.

Additionally included in the VERA Unity plugin are a variety of additional tools and features designed to aid in the process of creating your XR experiments in a more general context. 
Notably, the plugin features tools for streamlining the process of building and uploading your experiment for WebXR (see the `WebXR Guide <webxr.html>`_ section for more details),
as well as tools for providing accessibility options to participants with physical disabilities (see the `VLAT <vlat.html>`_ section for more details).

Getting Started
---------------

Below is a brief guide on how to get started with the VERA Unity plugin.
This guide will walk you through the process of properly installing the VERA Unity plugin, and how to run a demo scene to test your setup.
You can skip this section if you have already installed the VERA Unity plugin and ensured it is properly set up.

1. Ensure you have followed the steps outlined in the `Installation <installation.html>`_ and `Setup <setup.html>`_ sections to install Unity and the VERA Unity plugin.

2. Ensure you are connected to the VERA portal and have authenticated your Unity project. 
   Select the **VERA** tab in the Unity menu bar, then click on **Settings** and follow the authentication steps.
   Once complete, you should see your account information in the **VERA Settings** window.

3. Run the demo scene:

   - Navigate to `Packages` > `VERA` > `Runtime` > `Samples`.

   - Open the scene named `DemoScene`.

   - In the **VERA Settings** window, select your active experiment from the dropdown menu. Ensure this experiment is one compatible with the demo scene (i.e. the default *Demo Experiment* included with each new VERA account). If you do not have a compatible demo experiment, see the `Demo <demo.html>`_ section for details on how to create one.

   - Press the **Play** button in Unity to run the scene.

   - You should see the demo scene running in the Game view.

   - After a few seconds, a window will appear indicating that the data has been submitted to the VERA portal.

   - Navigate back to the VERA portal in your web browser, refresh the page, and you should see a newly submitted data entry corresponding to the demo scene.

See the `Demo <demo.html>`_ section for more details on running the demo scene and understanding the scripts included in the demo.
Once you have successfully run the demo scene, you have confirmed that your Unity project is set up correctly with the VERA plugin and can communicate with the VERA portal.

Using the VERA Settings Window
------------------------------------------------

The **VERA Settings** window is a key component of the VERA Unity plugin, allowing you to manage your connection to the VERA portal and configure your experiments.
To access the VERA Settings window, select the **VERA** tab in the Unity menu bar, then click on **Settings**.
If you do not see the VERA tab in the Unity menu bar, ensure that you have imported the VERA Unity package correctly (see the `Installation <installation.html>`_ section).

   .. image:: /_static/OpenVeraSettings.png
      :alt: How to open the VERA Settings window using the menu bar
      :width: 300px
      :align: center

If your Unity session is not yet authenticated, this VERA Settings window will prompt you to log in to your VERA account.
Authenticating using the VERA Settings window is what allows your Unity project to communicate with the VERA portal.
If you are not authenticated, you will not be able to log any data or otherwise interface with the VERA portal.

   .. image:: /_static/VeraSettingsWindowDeauthenticated.png
      :alt: The VERA Settings window, not yet authenticated
      :width: 300px
      :align: center

Once you are authenticated, the VERA Settings window will display your account information, including your name.
Below this information are a few sections used to manage your experiments, and generally manage your Unity VERA experience.

   .. image:: /_static/VeraSettingsWindow.png
      :alt: The VERA Settings window, authenticated
      :width: 300px
      :align: center

   - **Active Experiment**: This dropdown allows you to select the active experiment for your Unity project. The active experiment is the experiment to which all logged data will be submitted. The choices provided in this dropdown are those which you have created on the VERA portal. If the experiment you select is multi-site, you will also be able to select the active site for the experiment (see `Multi-Site Management <multi-site.html>`_ for more details on multi-site experiment management). There is additionally a **Refresh Experiments** button, which will refresh the list of experiments from the VERA portal if you have made any recent changes.
   
   - **Build Settings**: This section allows you to configure the build settings for your VERA experiment. Once you are ready to build your experiment for WebXR, you can use the **Build and Upload Experiment** button to do so automatically. This will build your Unity project for WebXR, adjusting all settings necessary for WebXR compatibility, and upload the built experiment to the VERA portal. See the `WebXR Guide <webxr.html>`_ for more details on building and uploading your experiment for WebXR.

   - **Connection Settings**: If you wish to check your connection to the VERA portal, you can use the **Am I Connected?** button. This will check your connection and display a message indicating whether you are connected or not. You may also adjust the **Enable Connection Notifications** toggle to enable or disable connection notifications. When enabled, you will receive notifications in the Unity console when your connection to the VERA portal is established or lost.

It is important to check the VERA Settings window periodically to ensure you are properly authenticated with VERA, and to ensure you have selected the proper experiment to which you wish to record data.

Next Steps
----------

For more details on specific features of the VERA Unity plugin, refer to the following sections:

   - `Logging Data <logging_data.html>`_: This section provides an in-depth guide on how to log data during XR experiments using the VERA Unity plugin, including how to use file types, log data to those file types, and manage participant sessions.
   - `WebXR Guide <webxr.html>`_: This section provides a guide on how to build and run your experiments in WebXR using the VERA tools, including how to configure your Unity project for WebXR compatibility and how to upload your experiments to the VERA portal.
   - `VLAT <vlat.html>`_: This section provides an overview of the VERA Locomotion Accessibility Toolkit (VLAT), which is designed to provide accessibility options for participants with physical disabilities during XR experiments.

For more details on the VERA web portal and how to manage your experiments, you can refer to the `VERA Portal: Overview <web_overview.html>`_ section.

If you'd like to see a concrete demonstration of the VERA Unity plugin in action, you can refer to the `Demo <demo.html>`_ section.