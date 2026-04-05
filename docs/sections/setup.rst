Setup
============
In order for your Unity experiments to properly communicate with the VERA portal, you need to set up your Unity project with the VERA plugin.

First, ensure you have completed the installation steps outlined in the `Installation <installation.html>`_ section. Then, you may begin the setup process:

1. **Log In to the VERA Portal**:

   - Open your web browser and navigate to the `VERA Portal <https://sreal.ucf.edu/vera-portal/>`_.
   - If you do not have an account, create one by clicking on **Sign Up** and following the instructions.
   - If you already have an account, log in with your credentials.

2. **Prepare Your Unity Project**:

   - Open your Unity project (recommended version: 2022.3.34f1).
   - Ensure the VERA Unity plugin and all dependencies have been properly installed (see the `Installation <installation.html>`_ section).

3. **Authenticate Your Unity Project**:

   - If you have properly installed the VERA Unity plugin, a **"VERA"** tab will appear in Unity's menu bar. Open it and select **Settings**.
   - This will open a **VERA Settings** window. This window will be used to manage a variety of settings related to VERA, including authentication and experiment selection.
   - In this window, click **Authenticate**. This will open a web browser to the VERA web portal.
   - This new browser window will automatically link your Unity project to your VERA account.

4. **Ensure You are Logged In**:

   - After authenticating, return to Unity and ensure that the **VERA Settings** window shows your account information.
   - If you see your account information, you are successfully authenticated.

Now that your Unity project is set up and authenticated with VERA, you can start creating and managing experiments using the VERA plugin.
In this same **VERA Settings** window, you can select your *active experiment* from the dropdown menu.
The selected active experiment will be used for all interactions with the VERA portal, such as data collection and experiment management.

For more details on the usage of the VERA Unity plugin, and for general next steps regarding your experiments, refer to the `Unity Plugin: Overview <unity_overview.html>`_ section.
For more details on the usage of the VERA web portal, refer to the `Web Portal: Overview <web_overview.html>`_ section.